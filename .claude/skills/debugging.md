# Debugging Flow

## Common Issues & Solutions

### "Element type is invalid" error
- Check all lazy-loaded screens have default exports
- Verify import names match export names
- Run `npx expo start --clear` to clear Metro cache

### Navigation not working
- Verify screen name exists in StackParamList
- Check navigation prop is passed correctly
- Use `navigation?.navigate?.('ScreenName')` for safety

### Supabase errors
- 406 error = RLS policy issue or Accept header
- 422 error = validation error (check email format)
- Check network tab for request details

### Style issues
- Check colors from useTheme() hook
- Verify StyleSheet.create syntax
- Use numeric values for positions (not percentages)
