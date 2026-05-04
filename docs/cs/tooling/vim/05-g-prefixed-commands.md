[← Back to Vim Directory](./index.md){ .md-button }

# Vim's `g`-prefixed commands

## 1. The core concept: `g` as a prefix

In Vim, `g` is a **prefix command** that extends the functionality of ther keys.

## 2. Text manipulation

- `gU`: Convert the following text to **uppercase**.

- `gu`: Convert the following text to **lowercase**.

- `g~`: Toggle the case of the following text.

- `gJ`: join lines without adding a space

## 3. How to learn more

Inside Vim, you can see a full list of `g`-prefixed commands by typing

```bash
:help g
```