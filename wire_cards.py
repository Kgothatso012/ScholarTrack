#!/usr/bin/env python3
"""Wire Card component into screens that use ...glass in StyleSheet."""
import re
import os

ROOT = os.path.expanduser('~/ScholarTrack-Expo54/src/screens')

def find_screens_with_glass():
    results = []
    for dirpath, _, filenames in os.walk(ROOT):
        for fn in filenames:
            if not fn.endswith('.tsx'):
                continue
            fpath = os.path.join(dirpath, fn)
            with open(fpath) as f:
                content = f.read()
            glass_vars = {}
            for m in re.finditer(r'const\s+(\w+)\s*=\s*cards\.glass(\w+)', content):
                glass_vars[m.group(1)] = m.group(2)
            if not glass_vars:
                continue
            has_spread = any(f'...{v}' in content for v in glass_vars)
            if has_spread:
                results.append((fpath, glass_vars))
    return results

def add_card_import(content):
    pattern = r"import\s*\{([^}]+)\}\s*from\s*['\"](?:\.\./)+ui-plugin/components['\"]"
    m = re.search(pattern, content)
    if m:
        imports = m.group(1)
        parts = [x.strip() for x in imports.split(',')]
        if 'Card' in parts:
            return content, True
        old_import = m.group(0)
        from_match = re.search(r"from\s*['\"]([^'\"]+)['\"]", old_import)
        if from_match:
            from_path = from_match.group(1)
            new_import = f"import {{ Card, {imports.strip() }}} from '{from_path}'"
            content = content.replace(old_import, new_import, 1)
            return content, True
    else:
        lines = content.split('\n')
        last_import_idx = 0
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                last_import_idx = i
        rel_path = '../../ui-plugin/components'
        for line in lines:
            if 'ui-plugin' in line and 'from' in line:
                m2 = re.search(r"from\s*['\"](\.\./)+ui-plugin", line)
                if m2:
                    rel_path = m2.group(1) + 'ui-plugin/components'
                    break
        import_line = f"import {{ Card }} from '{rel_path}';"
        lines.insert(last_import_idx + 1, import_line)
        content = '\n'.join(lines)
        return content, True
    return content, False

def find_glass_styles(content, glass_var_names):
    """Find all StyleSheet style definitions that contain ...glassVar spread."""
    style_to_var = {}
    for varname in glass_var_names:
        for m in re.finditer(r'\.\.\.' + re.escape(varname), content):
            pos = m.start()
            search_start = max(0, pos - 500)
            chunk = content[search_start:pos]
            style_matches = list(re.finditer(r'(\w+)\s*:\s*\{', chunk))
            if style_matches:
                style_name = style_matches[-1].group(1)
                if style_name not in style_to_var:
                    style_to_var[style_name] = varname
    return style_to_var

def remove_glass_spread_from_style(content, style_name, glass_var):
    """Remove ...glassVar from a style definition."""
    pattern = rf'({style_name}\s*:\s*\{{)([^}}]*)(\}})'
    m = re.search(pattern, content, re.DOTALL)
    if not m:
        return content
    
    open_brace = m.group(1)
    body = m.group(2)
    close_brace = m.group(3)
    
    # Remove ...glassVar from the body
    new_body = re.sub(r'\s*\.\.\.' + re.escape(glass_var) + r'\s*,\s*', ' ', body)
    new_body = re.sub(r'\s*,\s*\.\.\.' + re.escape(glass_var) + r'\s*', ' ', new_body)
    new_body = re.sub(r'\s*\.\.\.' + re.escape(glass_var) + r'\s*', ' ', new_body)
    
    new_body = new_body.strip()
    if new_body:
        new_def = f'{open_brace} {new_body} {close_brace}'
    else:
        new_def = f'{open_brace} {close_brace}'
    
    content = content[:m.start()] + new_def + content[m.end():]
    return content

def find_matching_close_tag(content, open_tag_end):
    """Find matching </View> or </Card> for a tag."""
    depth = 1
    pos = open_tag_end
    
    while pos < len(content) and depth > 0:
        next_view_open = content.find('<View', pos)
        next_view_close = content.find('</View>', pos)
        next_card_open = content.find('<Card', pos)
        next_card_close = content.find('</Card>', pos)
        
        candidates = []
        if next_view_open != -1:
            candidates.append((next_view_open, 'view_open'))
        if next_view_close != -1:
            candidates.append((next_view_close, 'view_close'))
        if next_card_open != -1:
            candidates.append((next_card_open, 'card_open'))
        if next_card_close != -1:
            candidates.append((next_card_close, 'card_close'))
        
        if not candidates:
            return -1
        
        candidates.sort()
        closest_pos, tag_type = candidates[0]
        
        if tag_type in ('view_open', 'card_open'):
            depth += 1
            end_tag = content.find('>', closest_pos)
            if end_tag == -1:
                return -1
            pos = end_tag + 1
        elif tag_type in ('view_close', 'card_close'):
            depth -= 1
            if depth == 0:
                return closest_pos
            if tag_type == 'view_close':
                pos = closest_pos + len('</View>')
            else:
                pos = closest_pos + len('</Card>')
    
    return -1

def find_style_attr_end(content, view_start):
    """Given position of '<View' that has style={, find the '>' that closes the opening tag.
    Handles nested braces in style={[s.x, { ... }]}, and additional props."""
    # Find 'style={' 
    style_idx = content.find('style={', view_start)
    if style_idx == -1:
        return -1
    
    # Start counting braces from the { after =
    brace_start = style_idx + len('style=')
    pos = brace_start
    depth = 0
    
    while pos < len(content):
        char = content[pos]
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                # Found the closing } of style={}
                # Now find the closing > of the tag
                # It could be immediately > or have other props
                rest = content[pos + 1:]
                # Find next > (could be > or />)
                gt_idx = rest.find('>')
                if gt_idx == -1:
                    return -1
                # Check if self-closing
                tag_end = pos + 1 + gt_idx
                return tag_end
        pos += 1
    return -1

def check_style_references(content, view_start, style_name):
    """Check if a <View> tag's style attribute references the given style_name."""
    # Find style={ ... }
    style_idx = content.find('style={', view_start)
    if style_idx == -1:
        return False
    
    # Find the end of style={}
    brace_start = style_idx + len('style=')
    pos = brace_start
    depth = 0
    end = -1
    while pos < len(content):
        char = content[pos]
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                end = pos
                break
        pos += 1
    
    if end == -1:
        return False
    
    style_content = content[brace_start:end + 1]
    # Check if it references styles.styleName or s.styleName
    if f'styles.{style_name}' in style_content or f's.{style_name}' in style_content:
        return True
    return False

def swap_view_to_card_in_jsx(content, style_name, glass_variant):
    """Replace <View style={...styleName...}> with <Card variant=... style=...> and matching </View> with </Card>."""
    changes = 0
    
    # Find all <View tags in the content
    view_pattern = r'<View\b'
    matches = list(re.finditer(view_pattern, content))
    
    # Filter to only those that reference our style_name
    targets = []
    for m in matches:
        if check_style_references(content, m.start(), style_name):
            targets.append(m.start())
    
    if not targets:
        return content, 0
    
    # Process in reverse order
    for view_start in reversed(targets):
        # Find the end of the opening tag (the >)
        tag_end = find_style_attr_end(content, view_start)
        if tag_end == -1:
            continue
        
        # Check if self-closing
        is_self_closing = content[tag_end - 1] == '/'
        
        # Build new opening tag: replace <View with <Card variant=... 
        # Keep everything else (style={...}, other props) the same
        old_tag = content[view_start:tag_end + 1]
        
        if is_self_closing:
            new_tag = old_tag.replace('<View', f'<Card variant="{glass_variant}"', 1)
            content = content[:view_start] + new_tag + content[tag_end + 1:]
            changes += 1
            continue
        
        new_tag = old_tag.replace('<View', f'<Card variant="{glass_variant}"', 1)
        
        # Find matching </View>
        close_pos = find_matching_close_tag(content, tag_end + 1)
        if close_pos == -1:
            # No matching close, just swap the opening tag
            content = content[:view_start] + new_tag + content[tag_end + 1:]
            changes += 1
            continue
        
        # Replace closing </View> with </Card>
        content = content[:close_pos] + '</Card>' + content[close_pos + len('</View>'):]
        
        # Replace opening tag
        content = content[:view_start] + new_tag + content[tag_end + 1:]
        
        changes += 1
    
    return content, changes

def process_file(fpath, glass_vars):
    with open(fpath) as f:
        original = f.read()
    
    content = original
    
    style_to_var = find_glass_styles(content, list(glass_vars.keys()))
    
    if not style_to_var:
        return fpath, 0, 'no glass styles found'
    
    # Detect card-in-card
    container_patterns = ['section', 'container', 'content', 'wrapper', 
                         'scrollContent', 'scrollView', 'screen', 'page',
                         'body', 'main']
    
    skip_styles = set()
    
    for sname in list(style_to_var.keys()):
        is_container = any(cp in sname.lower() for cp in container_patterns)
        if not is_container:
            continue
        
        # Find View with this style
        view_pattern = r'<View\b'
        for vm in re.finditer(view_pattern, content):
            if check_style_references(content, vm.start(), sname):
                tag_end = find_style_attr_end(content, vm.start())
                if tag_end == -1:
                    continue
                close_pos = find_matching_close_tag(content, tag_end + 1)
                if close_pos != -1:
                    block = content[tag_end + 1:close_pos]
                    for other_sname in style_to_var:
                        if other_sname == sname:
                            continue
                        if f'styles.{other_sname}' in block or f's.{other_sname}' in block:
                            skip_styles.add(sname)
                            break
                    if sname in skip_styles:
                        break
    
    # Add Card import
    content, added_import = add_card_import(content)
    
    total_changes = 0
    for sname, varname in style_to_var.items():
        if sname in skip_styles:
            continue
        
        variant = 'glassAmber' if glass_vars[varname] == 'Amber' else 'glassCyan'
        
        # Remove ...glass from the StyleSheet definition
        content = remove_glass_spread_from_style(content, sname, varname)
        
        # Swap <View> to <Card> in JSX
        content, changes = swap_view_to_card_in_jsx(content, sname, variant)
        total_changes += changes
    
    if content != original:
        with open(fpath, 'w') as f:
            f.write(content)
        return fpath, total_changes, f'import_added={added_import}, styles={len(style_to_var)}, skipped={len(skip_styles)}, changes={total_changes}'
    else:
        return fpath, 0, 'no changes'

def main():
    screens = find_screens_with_glass()
    print(f"Found {len(screens)} screens with glass styles")
    
    total_changes = 0
    for fpath, glass_vars in sorted(screens):
        fname = os.path.relpath(fpath, os.path.expanduser('~/ScholarTrack-Expo54'))
        try:
            _, changes, msg = process_file(fpath, glass_vars)
            total_changes += changes
            print(f"  {fname}: {msg}")
        except Exception as e:
            print(f"  {fname}: ERROR - {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\nTotal JSX changes: {total_changes}")

if __name__ == '__main__':
    main()