# Contributing to Blockchain Voting System

Thank you for your interest in contributing! This is an educational project and we welcome suggestions and improvements.

## How to Contribute

### 1. Report Issues
- Found a bug? Open an issue with details
- Include steps to reproduce
- Share error messages and screenshots

### 2. Suggest Features
- Have an idea? Create an issue
- Describe the feature clearly
- Explain why it's useful

### 3. Submit Code Changes
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit with clear messages (`git commit -m 'Add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Code Standards

- Follow existing code style
- Use meaningful variable names
- Add comments for complex logic
- Test your changes before submitting

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/ovsblockchain.git
cd ovsblockchain

# Install dependencies
npm install
cd src/voting_frontend && npm install && cd ../..

# Start development
dfx start --background --clean
dfx deploy
cd src/voting_frontend && npm run dev
```

## Areas for Contribution

- [ ] Bug fixes
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Documentation improvements
- [ ] Test coverage
- [ ] Security enhancements
- [ ] Mobile responsiveness
- [ ] Accessibility features
- [ ] Translations/Localization

## Questions?

- Check existing issues and discussions
- Ask in pull request comments
- Read documentation files

## Code of Conduct

Be respectful and professional. This is an educational project.

---

Thank you for contributing! 🙏
