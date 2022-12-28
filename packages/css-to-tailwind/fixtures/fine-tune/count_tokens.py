#!/usr/bin/env python3

from tiktoken import get_encoding
import sys

enc = get_encoding("gpt2")

# tokenize the shell arguments
res = enc.encode(" ".join(sys.argv[1:]))

# print the result length
count = len(res)
print("Token count: {}".format(count))
print()


print("Fine-tuning costs:")
print("  Ada: {:.2f} USD".format(count * 0.0004 / 1000))
print("  Babbage: {:.2f} USD".format(count * 0.0006 / 1000))
print("  Curie: {:.2f} USD".format(count * 0.003 / 1000))
print("  Davinci: {:.2f} USD".format(count * 0.03 / 1000))
