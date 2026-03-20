#!/usr/bin/env python3
"""Reddit browser automation using system Chromium + Xvfb."""

import sys
import time
from playwright.sync_api import sync_playwright
from dotenv import dotenv_values


def reddit_login_and_comment(thread_url: str, comment_text: str, screenshot_dir='/tmp'):
    """Login to Reddit and post a comment on a thread."""
    env = dotenv_values('.env')
    username = env['REDDIT_HERALD_USERNAME']
    password = env['REDDIT_HERALD_PASSWORD']

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/usr/bin/chromium',
            headless=False,
            args=[
                '--no-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
            ]
        )
        context = browser.new_context(
            user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.80 Safari/537.36',
            viewport={'width': 1280, 'height': 900},
            locale='en-US',
        )
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        """)
        page = context.new_page()

        # Step 1: Login
        print("Navigating to Reddit login...")
        page.goto('https://www.reddit.com/login', wait_until='domcontentloaded', timeout=30000)
        time.sleep(3)

        user_field = page.locator('input[name="username"]').first
        user_field.click()
        time.sleep(0.3)
        user_field.type(username, delay=50)
        time.sleep(0.5)

        pass_field = page.locator('input[name="password"], input[type="password"]').first
        pass_field.click()
        time.sleep(0.3)
        pass_field.type(password, delay=50)
        time.sleep(0.5)

        page.locator('button[type="submit"], button:has-text("Log In")').first.click()
        print("Login submitted...")
        time.sleep(8)

        if '/login' in page.url:
            print("❌ Still on login page")
            page.screenshot(path=f'{screenshot_dir}/reddit_login_fail.png')
            browser.close()
            return False

        print(f"✅ Logged in! URL: {page.url}")

        # Step 2: Navigate to thread
        print(f"Navigating to thread...")
        page.goto(thread_url, wait_until='domcontentloaded', timeout=45000)
        time.sleep(5)

        # Step 3: Click "Join the conversation" to activate comment box
        print("Looking for comment input...")
        
        # Try clicking the "Join the conversation" placeholder area
        join_selectors = [
            'text="Join the conversation"',
            'input[placeholder*="Join the conversation"]',
            'div[placeholder*="Join"]',
            '[data-testid="comment-composer-area"]',
            'shreddit-composer',
        ]
        
        activated = False
        for sel in join_selectors:
            try:
                loc = page.locator(sel).first
                if loc.is_visible(timeout=2000):
                    loc.click()
                    print(f"Clicked: {sel}")
                    time.sleep(3)
                    activated = True
                    break
            except Exception as e:
                continue
        
        if not activated:
            # Try scrolling to comment area and clicking
            page.evaluate('window.scrollTo(0, 500)')
            time.sleep(2)
            # Try clicking by coordinates based on what we saw
            try:
                page.click('text="Join the conversation"', timeout=5000)
                activated = True
                print("Clicked 'Join the conversation' via text")
                time.sleep(3)
            except:
                pass

        page.screenshot(path=f'{screenshot_dir}/reddit_after_click.png')

        # Step 4: Find the now-visible contenteditable div and type
        comment_selectors = [
            'div[contenteditable="true"]',
            'div[data-lexical-editor="true"]',
            'p[data-placeholder]',
        ]
        
        comment_area = None
        for sel in comment_selectors:
            try:
                locs = page.locator(sel).all()
                for loc in locs:
                    if loc.is_visible(timeout=1000):
                        comment_area = loc
                        print(f"Found visible comment area: {sel}")
                        break
                if comment_area:
                    break
            except:
                continue

        if comment_area:
            comment_area.click()
            time.sleep(0.5)
            page.keyboard.type(comment_text, delay=15)
            print(f"Comment entered ({len(comment_text)} chars)")
            time.sleep(2)
            
            page.screenshot(path=f'{screenshot_dir}/reddit_typed.png')
            
            # Submit
            submit_selectors = [
                'button:has-text("Comment")',
                'button[slot="submit-button"]',
                'faceplate-tracker button',
            ]
            for sel in submit_selectors:
                try:
                    btns = page.locator(sel).all()
                    for btn in btns:
                        if btn.is_visible(timeout=1000):
                            text = btn.text_content() or ''
                            if 'comment' in text.lower() or 'submit' in text.lower():
                                btn.click()
                                print(f"✅ Comment submitted via: {sel} ('{text}')")
                                time.sleep(5)
                                page.screenshot(path=f'{screenshot_dir}/reddit_done.png')
                                browser.close()
                                return True
                except:
                    continue
            
            print("Could not find submit button after typing")
            # Try pressing Ctrl+Enter as fallback
            page.keyboard.press('Control+Enter')
            time.sleep(3)
            page.screenshot(path=f'{screenshot_dir}/reddit_ctrlenter.png')
        else:
            print("Could not find visible comment area after clicking")
            # Debug: what's on the page now?
            structure = page.evaluate('''() => {
                const els = document.querySelectorAll('textarea, [contenteditable="true"], shreddit-composer, [data-lexical-editor]');
                return Array.from(els).map(e => ({
                    tag: e.tagName, id: e.id,
                    class: (e.className?.substring?.(0, 60) || ''),
                    vis: e.offsetParent !== null,
                    rect: e.getBoundingClientRect()
                }));
            }''')
            for s in structure:
                print(f"  {s}")
            page.screenshot(path=f'{screenshot_dir}/reddit_debug.png')

        browser.close()
        return False


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: reddit_browser.py <thread_url> <comment_text>")
        sys.exit(1)

    success = reddit_login_and_comment(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)
