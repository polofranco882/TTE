# Page snapshot

```yaml
- generic [ref=e8]:
  - button [ref=e11] [cursor=pointer]:
    - img [ref=e12]
  - button "Back" [ref=e15] [cursor=pointer]:
    - img [ref=e16]
    - text: Back
  - img "TTESOL Logo" [ref=e21]
  - generic [ref=e22]:
    - heading "Welcome Back" [level=1] [ref=e23]
    - paragraph [ref=e24]: Sign in to your account
  - generic [ref=e25]:
    - generic [ref=e26]:
      - text: Email Address
      - generic [ref=e27]:
        - img [ref=e28]
        - textbox "admin@ttesol.com" [active] [ref=e31]
    - generic [ref=e32]:
      - text: Password
      - generic [ref=e33]:
        - img [ref=e34]
        - textbox "password123" [ref=e37]
    - button "Sign In" [ref=e38] [cursor=pointer]:
      - text: Sign In
      - img [ref=e39]
  - generic [ref=e42]:
    - generic [ref=e43] [cursor=pointer]: Admin Access Only
    - generic [ref=e44] [cursor=pointer]: Forgot password?
```