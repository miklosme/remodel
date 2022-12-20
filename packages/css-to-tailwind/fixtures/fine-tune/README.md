### Count tokens in prompt file

```bash
cat everything.json | jq ".[0].prompt" | xargs ./count_tokens.py
```
