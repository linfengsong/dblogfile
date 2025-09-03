import torch
gpu_memory_bytes = torch.cuda.get_device_properties(0).total_memory
gpu_memory_gb = round(gpu_memory_bytes / (2**30))
print(f"Available GPU memory: {gpu_memory_gb} GB")
if gpu_memory_gb < 5.1:
    print(f"Your available GPU memory is {gpu_memory_gb}GB, you may not have enough memory to run a Gemma LLM locally without quantization.")
    use_quantization_config = False
elif gpu_memory_gb < 8.1:
    print(f"GPU memory: {gpu_memory_gb}GB | Recommend model: Gemma 2B in 4-bit precision.")
    model_id = "google/gemma-2b-it"
    use_quantization_config = True
elif gpu_memory_gb < 19.0:
    print(f"GPU memory: {gpu_memory_gb}GB | Recommend model: Gemma 2B in float16 or Gemma 7B in 4-bit precision.")
    model_id = "google/gemma-2b-it"
    use_quantization_config = False
elif gpu_memory_gb > 19.0:
    print(f"GPU memory: {gpu_memory_gb}GB | Recommend model: Gemma 7B in 4-bit or float16 precision.")
    model_id = "google/gemma-7b-it"
    use_quantization_config = False

print(f"use_quantization_config set to: {use_quantization_config}")
print(f"model_id set to: {model_id}")

from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers.utils import is_flash_attn_2_available

from transformers import BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(load_in_4bit=True,
                                         bnb_4bit_compute_dtype=torch.float16)

print(torch.cuda.get_device_capability(0)[0])
print(is_flash_attn_2_available())
if (is_flash_attn_2_available()) and (torch.cuda.get_device_capability(0)[0] >= 8):
  attn_implementation = "flash_attention_2"
else:
  attn_implementation = "sdpa"
print(f"Using attention implementation: {attn_implementation}")

model_id = "google/gemma-7b-it"

token = ""

tokenizer = AutoTokenizer.from_pretrained(pretrained_model_name_or_path=model_id, token=token)

llm_model = AutoModelForCausalLM.from_pretrained(pretrained_model_name_or_path=model_id,
                                                 torch_dtype=torch.float16,
                                                 quantization_config=quantization_config if use_quantization_config else None,
                                                 low_cpu_mem_usage=False,
                                                 attn_implementation=attn_implementation,
                                                 token=token)
if not use_quantization_config:
    llm_model.to("cuda")

def get_model_num_params(model: torch.nn.Module):
    return sum([param.numel() for param in model.parameters()])

get_model_num_params(llm_model)

def get_model_mem_size(model: torch.nn.Module):
    mem_params = sum([param.nelement() * param.element_size() for param in model.parameters()])
    mem_buffers = sum([buf.nelement() * buf.element_size() for buf in model.buffers()])

    model_mem_bytes = mem_params + mem_buffers
    model_mem_mb = model_mem_bytes / (1024**2)
    model_mem_gb = model_mem_bytes / (1024**3)

    return {"model_mem_bytes": model_mem_bytes,
            "model_mem_mb": round(model_mem_mb, 2),
            "model_mem_gb": round(model_mem_gb, 2)}

get_model_mem_size(llm_model)

input_text = "Waht are then macronutrients, and what roles do they play in the human body?"
print(f"input test:{input_text}")

dialogue_template =  [
    {"role": "user",
     "content": input_text
    }
]

prompt = tokenizer.apply_chat_template(conversation=dialogue_template,
                                       tokenize=False,
                                       add_generation_prompt=True)
print(f"\nPrompt (formatted):\n{prompt}")

input_ids = tokenizer(prompt,
                      return_tensors="pt").to("cuda")
outputs = llm_model.generate(**input_ids,
                             max_new_tokens=256)
print(f"Model output (tokens):\n{outputs[0]}")

outputs_decoded = tokenizer.decode(outputs[0])
print(f"Model output (decoded):\n{outputs_decoded}")