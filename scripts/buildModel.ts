import { uploadFile } from '@huggingface/hub';
import { spawn } from "child_process";
import { join } from "path";

const buildModel = async () => {
  console.log("Building TinyLlama...");
  
  const bazelProcess = spawn("bazel", [
    "build",
    "-c",
    "opt",
    "//llama:TinyLlama-1.1B-Chat",
  ], { stdio: "inherit", cwd: join(process.cwd(), "models") });

  await new Promise<void>((resolve, reject) => {
    bazelProcess.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Build failed with code ${code}`));
    });
  });

  // Upload files with their correct paths
  const files = [
    {
      path: "models/bazel-bin/llama/TinyLlama-1.1B-Chat.runfiles/_main/llama/TinyLlama-1.1B-Chat",
      name: "TinyLlama-1.1B-Chat"
    },
    {
      path: "models/bazel-bin/llama/TinyLlama-1.1B-Chat.runfiles/zml~~huggingface~TinyLlama-1.1B-Chat-v1.0/model.safetensors",
      name: "model.safetensors"
    },
    {
      path: "models/bazel-bin/llama/TinyLlama-1.1B-Chat.runfiles/zml~~huggingface~TinyLlama-1.1B-Chat-v1.0/tokenizer.model",
      name: "tokenizer.model"
    }
  ];

  for (const file of files) {
    await uploadFile({
      file: {
        path: file.name,
        content: Bun.file(join(process.cwd(), file.path))
      },
      repo: { type: "model", name: "mattzcarey/zeval-llm-as-judge" },
      accessToken: process.env.HF_TOKEN ,
    });
  }

  console.log("✅ Files uploaded to Hugging Face");
};

const main = async () => {
  try {
    await buildModel();
    console.log("✅ Build successful");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
};

main();
