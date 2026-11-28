# Changelog
<!-- rman:documented-up-to 1cabe9ea9aaf0408564b7928161dde0566ef2ac4 -->

## v1.10.3 (2026-11-28)

### 🐛 Bug Fixes

- name the unclosed bracket in its error message (f92f4bb)

### 🧪 Tests

- cover the remaining paths of tokenize (b130437)

### 📦 Build System

- upgrade dependencies (e829564)

### 🤖 Continuous Integration

- send coverage to Coveralls from the release (b367c04)

### 🧹 Chores

- set the LICENSE copyright holder to Panates (a29a177)
- remove .coveralls.yml (81b80c5)
- keep the session handoff note in .claude/local/ (7a9b115)

---

## v1.10.2 (2026-11-15)

### 🐛 Bug Fixes

- return trailing empty token when input ends with a delimiter (cea0b19)

### 📚 Documentation

- add CODE_OF_CONDUCT.md and CHANGELOG.md from the templates (840c009)
- replace the CircleCI badge with the GitHub Actions test badge (881d8a2)

### 🧪 Tests

- fix the type check of test/ (3a3333a)

### 📦 Build System

- upgrade to TypeScript 6 (db55a40)
- move to pnpm and rman (b6fb097)
- upgrade dependencies (bc6ea7d)

### 🤖 Continuous Integration

- move test.yml and release.yml to the rman templates (a767fc0)
- require main pull requests from dev and drop qc.yml (0fdf183)

### 🧹 Chores

- require Node.js 22 and update contributors (6642315)
- align lint, TypeScript and ignore files with the templates (6f092fc)
- add SECURITY.md and a shared Claude Code settings file (46ca870)
