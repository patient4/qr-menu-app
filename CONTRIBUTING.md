# Contributing to Restaurant Ordering System

We welcome contributions to the Restaurant Ordering System! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Local Setup
```bash
# Clone your fork
git clone https://github.com/yourusername/restaurant-ordering-system.git
cd restaurant-ordering-system

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database configuration

# Set up database
npm run db:push

# Start development server
npm run dev
```

## Code Style Guidelines

### TypeScript
- Use TypeScript for all new code
- Enable strict mode
- Define proper interfaces and types
- Use meaningful variable and function names

### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Follow the existing component structure
- Use TypeScript for props and state

### Database
- Use Drizzle ORM for all database operations
- Define schemas in `shared/schema.ts`
- Use migrations for schema changes
- Follow naming conventions (snake_case for columns)

### API Design
- Use RESTful conventions
- Implement proper error handling
- Return consistent response formats
- Include proper HTTP status codes

## Testing

### Running Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:ui           # Run tests with UI
```

### Writing Tests
- Write unit tests for utility functions
- Create integration tests for API endpoints
- Test React components with Testing Library
- Aim for meaningful test coverage

## Documentation

### Code Documentation
- Add JSDoc comments for complex functions
- Update README for new features
- Document API endpoints
- Include examples where helpful

### Commit Messages
Use conventional commit format:
```
type(scope): description

feat(auth): add user registration
fix(orders): resolve order status update bug
docs(readme): update installation instructions
```

## Pull Request Process

### Before Submitting
- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Database migrations work correctly

### PR Description
Include:
- Clear description of changes
- Motivation for the change
- Screenshots for UI changes
- Breaking changes (if any)
- Testing instructions

### Review Process
1. Automated checks must pass
2. Code review by maintainers
3. Testing on staging environment
4. Approval and merge

## Feature Development

### New Features
1. Discuss the feature in an issue first
2. Create detailed design if needed
3. Break down into smaller tasks
4. Implement with tests
5. Update documentation

### Bug Fixes
1. Reproduce the bug
2. Write a failing test
3. Fix the bug
4. Ensure test passes
5. Consider edge cases

## Database Changes

### Schema Updates
- Add new schemas to `shared/schema.ts`
- Use Drizzle migrations
- Test migrations thoroughly
- Document breaking changes

### Data Migration
- Create migration scripts
- Test with production-like data
- Provide rollback procedures
- Coordinate with deployment

## Release Process

### Version Numbering
We follow semantic versioning (SemVer):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Steps
1. Update version in package.json
2. Update CHANGELOG.md
3. Create release branch
4. Test thoroughly
5. Merge to main
6. Tag release
7. Deploy to production

## Security Guidelines

### General Security
- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user inputs
- Implement proper authentication
- Follow OWASP guidelines

### Database Security
- Use parameterized queries
- Implement proper access controls
- Encrypt sensitive data
- Regular security audits

## Performance Guidelines

### Frontend Performance
- Optimize bundle size
- Implement lazy loading
- Use React.memo where appropriate
- Minimize re-renders

### Backend Performance
- Optimize database queries
- Implement caching strategies
- Monitor response times
- Use connection pooling

## Deployment

### Environment Considerations
- Test in staging environment
- Use feature flags for gradual rollouts
- Monitor application metrics
- Have rollback procedures ready

### Database Deployment
- Run migrations before code deployment
- Backup database before changes
- Test migrations on staging first
- Monitor for performance impact

## Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Collaborate effectively

### Communication
- Use GitHub issues for bugs and features
- Join discussions in pull requests
- Be patient with review process
- Ask questions when unclear

## Resources

### Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Testing Library](https://testing-library.com/)

### Tools
- [VS Code](https://code.visualstudio.com/) with TypeScript extension
- [PostgreSQL](https://www.postgresql.org/)
- [Postman](https://www.postman.com/) for API testing

## Questions?

If you have questions about contributing:
1. Check existing issues and documentation
2. Create a new issue with the "question" label
3. Join our community discussions

Thank you for contributing to Restaurant Ordering System!