import { ChildProcess, spawn } from 'child_process';
import { chmodSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { z } from 'zod';

type ZevalConfig = {
  modelVersion?: string;
}

export class Zeval {
  private modelProcess: ChildProcess | null = null;
  private readonly modelVersion: string;
  private modelPath: string | null = null;
  
  constructor(config: ZevalConfig = {}) {
    this.modelVersion = config.modelVersion ?? "latest";
  }

  private getModelDir(): string {
    const modelDir = join(homedir(), '.zeval', 'models');
    if (!existsSync(modelDir)) {
      mkdirSync(modelDir, { recursive: true });
    }
    return modelDir;
  }

  private async downloadModel(): Promise<string> {
    const platform = process.platform;
    const arch = process.arch;
    const modelDir = this.getModelDir();
    const binaryName = `zeval-${platform}-${arch}`;
    const modelPath = join(modelDir, binaryName);

    // Return cached model if it exists
    if (existsSync(modelPath)) {
      return modelPath;
    }

    // Download from GitHub releases
    const url = `https://github.com/mattzcarey/zeval/releases/download/${this.modelVersion}/${binaryName}`;
    
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    await Bun.write(modelPath, buffer);

    // Make binary executable
    chmodSync(modelPath, '755');
    
    return modelPath;
  }

  private async ensureModelRunning(): Promise<void> {
    if (this.modelProcess) return;

    if (!this.modelPath) {
      this.modelPath = await this.downloadModel();
    }

    this.modelProcess = spawn(this.modelPath, [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle process errors
    this.modelProcess.on('error', (error) => {
      console.error('Model process error:', error);
      this.modelProcess = null;
    });

    this.modelProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Model process exited with code ${code}`);
      }
      this.modelProcess = null;
    });
  }

  async generate(input: string): Promise<string> {
    await this.ensureModelRunning();
    
    if (!this.modelProcess?.stdin || !this.modelProcess?.stdout) {
      throw new Error('Model process not running');
    }

    return new Promise((resolve, reject) => {
      let output = '';

      this.modelProcess!.stdout!.on('data', (data) => {
        output += data.toString();
      });

      this.modelProcess!.stdout!.on('end', () => {
        resolve(output.trim());
      });

      this.modelProcess!.stdin!.write(input + '\n');
    });
  }

  async eval<T>({ output, prompt, responseModel }: {
    output: string,
    prompt: string,
    responseModel: z.ZodType<T>
  }): Promise<T> {
    // Construct evaluation prompt
    const evalPrompt = `
Given this output: "${output}"
And this requirement: "${prompt}"
Respond with true if the output meets the requirement, false otherwise.
Respond with only true or false.
    `.trim();

    const result = await this.generate(evalPrompt);
    
    try {
      // Parse "true" or "false" string to boolean, then validate with zod
      const boolResult = result.toLowerCase().trim() === 'true';
      return responseModel.parse(boolResult);
    } catch (error) {
      throw new Error(`Failed to parse model response: ${result}`);
    }
  }

  async cleanup(): Promise<void> {
    if (this.modelProcess) {
      this.modelProcess.kill();
      this.modelProcess = null;
    }
  }
}
