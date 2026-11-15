# Changelog
<!-- rman:documented-up-to a278f3600dfd131453ab97828d3c3b5cb1c686a6 -->

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
