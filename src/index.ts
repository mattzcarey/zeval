import { spawn } from 'child_process';
import { join } from 'path';
import { z } from 'zod';

type ZevalConfig = {
  debug?: boolean;
}

export class Zeval {
  private modelDir: string;

  constructor(private config: ZevalConfig = {}) {
    this.modelDir = join(process.cwd(), 'build');
  }

  async generate(prompt: string): Promise<string> {
    console.log("🦓 Running model from:", this.modelDir);
    console.log("🦓 Prompt:", prompt);

    const modelProcess = spawn(join(this.modelDir, 'bin', 'TinyLlama-Stories-15M'), [
      `--model=${join(this.modelDir, 'model/stories15M.tinyllama')}`,
      `--tokenizer=${join(this.modelDir, 'tokenizer/stories260K.tinyllama')}`,
      `--prompt=${prompt}`
    ], {
      cwd: this.modelDir,
      stdio: this.config.debug ? 'inherit' : ['pipe', 'pipe', 'pipe']
    });

    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';

      modelProcess.stdout?.on('data', (data) => {
        const str = data.toString();
        output += str;
        if (this.config.debug) console.log("🦓 Output:", str);
      });

      modelProcess.stderr?.on('data', (data) => {
        error += data.toString();
        if (this.config.debug) console.error("🦓 Error:", data.toString());
      });

      modelProcess.on('error', (err) => {
        console.error("🦓 Error:", err);
        reject(err);
      });
      
      modelProcess.on('close', (code) => {
        console.log("🦓 Model exited with code:", code);
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Model exited with code ${code}\nError: ${error}`));
        }
      });
    });
  }

  async generateFake(input: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return "true";
  }

  async eval<T>({ output, prompt }: {
    output: string,
    prompt: string,
  }): Promise<boolean> {
    // Construct evaluation prompt
    const evalPrompt = `System: You reply with true or false.

User: Given this output: "${output}". And this requirement: "${prompt}". Does the output meet the requirement? True or False.

Assistant:`.trim();

    const result = await this.generate(evalPrompt);
    console.log("🦓 Result:", result);
    
    try {
      const boolResult = result.toLowerCase().trim() === 'true';
      return z.boolean().parse(boolResult);
    } catch (error) {
      throw new Error(`Failed to parse model response: ${result}`);
    }
  }

  static async load(config: ZevalConfig = {}): Promise<Zeval> {
    return new Zeval(config);
  }
}
