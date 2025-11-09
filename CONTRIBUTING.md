# Contributing to Solana Invoice Pay

Thank you for your interest in contributing! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, browser, Node version)

### Suggesting Features

We love new ideas! Open an issue with:
- Clear description of the feature
- Use case and benefits
- Any implementation ideas you have

### Pull Requests

1. **Fork the repository**
2. **Create a branch** for your feature/fix
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments where needed
   - Update documentation if needed

4. **Test your changes**
   - Make sure the app runs without errors
   - Test on both devnet and mainnet (if applicable)
   - Test on different browsers/devices

5. **Commit your changes**
   ```bash
   git commit -m "Add: brief description of your changes"
   ```
   Use conventional commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for updates to existing features
   - `Docs:` for documentation changes

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Describe what your PR does
   - Reference any related issues
   - Include screenshots if UI changes

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/solana-invoice-pay.git

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Run development server
npm run dev
```

## Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable names
- Add comments for complex logic

## Testing

Before submitting a PR:
- [ ] Test on devnet
- [ ] Test payment creation
- [ ] Test payment receiving (both methods)
- [ ] Test auto-forwarding
- [ ] Test dashboard
- [ ] Check for console errors
- [ ] Test on mobile

## Questions?

Feel free to open an issue for any questions or reach out to the maintainers.

Thank you for contributing! 🙏
