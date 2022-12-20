#!/usr/bin/env python3

from tiktoken import get_encoding
import sys

enc = get_encoding("gpt2")

# tokenize the shell arguments
res = enc.encode(" ".join(sys.argv[1:]))

# print the result length
print(len(res))
