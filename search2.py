import random

import torch
import numpy as np
import pandas as pd

device = "cuda" if torch.cuda.is_available() else "cpu"

# Import texts and embedding df
text_chunks_and_embedding_df = pd.read_csv("text_chunks_and_embeddings_df.csv")

# Convert embedding column back to np.array (it got converted to string when it saved to CSV)
text_chunks_and_embedding_df["embedding"] = text_chunks_and_embedding_df["embedding"].apply(lambda x: np.fromstring(x.strip("[]"), sep= " "))

# Convert out embedding into a torch.tensor
embeddings = torch.tensor(np.stack(text_chunks_and_embedding_df["embedding"].tolist(), axis=0), dtype=torch.float32).to(device)

# Convert texts and embedding dof to list of dicts
pages_and_chunks = text_chunks_and_embedding_df.to_dict(orient="records")

from sentence_transformers import util, SentenceTransformer

embedding_model = SentenceTransformer(model_name_or_path="all-mpnet-base-v2", device=device)

query = "macronutrient functions"

query_embedding = embedding_model.encode(query, convert_to_tensor=True).to(device)

print(pages_and_chunks[42])

import textwrap

def print_wrapped(text, wrap_length=80):
    wrapped_text = textwrap.fill(text, wrap_length)
    print(wrapped_text)

def retrieve_relevant_resources(query: str,
                                embeddings: torch.tensor,
                                model: SentenceTransformer=embedding_model,
                                n_resources_to_return: int=5,
                                print_time: bool=True):
    # Enbed the query
    query_embedding = model.encode(query, convert_to_tensor=True)

    # Get dot product scores on embeddins
    dot_scores = util.dot_score(query_embedding, embeddings)[0]

    if print_time:
        print(f"[INFO] Time taken to et scores on ({len(query_embedding)} embeddings")

    scores, indices = torch.topk(input=dot_scores,
                                 k=n_resources_to_return)

    return  scores, indices

def print_top_results_and_scores(query: str,
                                embeddings: torch.tensor,
                                pages_and_chunks: list[dict],
                                n_resources_to_return: int=5):
  scores, indices = retrieve_relevant_resources(query,
                                                embeddings=embeddings,
                                                n_resources_to_return=n_resources_to_return)
 
  # Loop through zipped together scores and indicies from torch.topk
  for score, idx in zip(scores, indices):
    print(f"Score: {score:.4f}")
    # Print relevant sentence chunk (since the scores are in descending order, the most relevant chunk will be first)
    print("Text:")
    print_wrapped(pages_and_chunks[idx]["sentence_chunk"])
    # Print the page number too so we can reference the textbook further (and check the results)
    print(f"Page number: {pages_and_chunks[idx]['page_number']}")
    print("\n")

print_top_results_and_scores(query, embeddings, pages_and_chunks)