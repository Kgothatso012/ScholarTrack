# Code Review Checklist

## Before submitting:
- [ ] No console.logs left in production code
- [ ] All interactive elements have accessibility labels
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Screens use React.lazy() for imports
- [ ] No hardcoded credentials or secrets

## React Native specific:
- [ ] Safe area insets used for notches
- [ ] Colors from ThemeContext (not hardcoded)
- [ ] Touch targets are at least 44x44
