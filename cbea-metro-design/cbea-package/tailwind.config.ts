import type { Config } from 'tailwindcss';

/**
 * Tailwind v3 config for the CBEA Budget Transparency Portal.
 * Generated from DESIGN.md via `@google/design.md export --format json-tailwind`,
 * with cross-platform font fallbacks applied.
 *
 * If you are on Tailwind v4, use app/theme.css instead — the @theme block
 * is the canonical integration path for v4.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
        "colors": {
            "on-primary": "#000000",
            "background": "#ffffff",
            "on-background": "#000000",
            "secondary": "#7a7a7a",
            "tertiary": "#4a4a4a",
            "surface": "#f4f4f4",
            "outline": "#e0e0e0",
            "income": "#2d7a2d",
            "on-income": "#ffffff",
            "expense": "#c81000",
            "on-expense": "#ffffff",
            "error": "#c81000",
            "warning": "#f09609",
            "accent-blue": "#1ba1e2",
            "accent-brown": "#a05000",
            "accent-magenta": "#ff0097",
            "accent-purple": "#a200ff",
            "accent-teal": "#00aba9",
            "accent-green": "#339933",
            "accent-red": "#c81000",
            "accent-orange": "#f09609",
            "accent-pink": "#e671b8",
            "accent-lime": "#8cbf26",
            "primary": "#8cbf26"
        },
        "fontFamily": {
            "caption": [
                "\"Segoe UI\", system-ui, -apple-system, \"Helvetica Neue\", Arial, sans-serif"
            ],
            "body-sm": [
                "\"Segoe UI\", system-ui, -apple-system, \"Helvetica Neue\", Arial, sans-serif"
            ],
            "body-sm-strong": [
                "\"Segoe UI\", system-ui, -apple-system, \"Helvetica Neue\", Arial, sans-serif"
            ],
            "body-md": [
                "\"Segoe UI\", system-ui, -apple-system, \"Helvetica Neue\", Arial, sans-serif"
            ],
            "headline-sm": [
                "\"Segoe UI\", system-ui, -apple-system, \"Helvetica Neue\", Arial, sans-serif"
            ],
            "headline-md": [
                "\"Segoe UI\", system-ui, -apple-system, \"Helvetica Neue\", Arial, sans-serif"
            ],
            "headline-lg": [
                "\"Segoe UI\", system-ui, -apple-system, \"Helvetica Neue\", Arial, sans-serif"
            ],
            "headline-display": [
                "\"Segoe UI\", system-ui, -apple-system, \"Helvetica Neue\", Arial, sans-serif"
            ],
            "display-xl": [
                "\"Segoe UI\", system-ui, -apple-system, \"Helvetica Neue\", Arial, sans-serif"
            ],
            "stat-value": [
                "\"Segoe UI\", system-ui, -apple-system, \"Helvetica Neue\", Arial, sans-serif"
            ],
            "label-caps": [
                "\"Segoe UI\", system-ui, -apple-system, \"Helvetica Neue\", Arial, sans-serif"
            ]
        },
        "fontSize": {
            "caption": [
                "12px",
                {
                    "lineHeight": "16px",
                    "fontWeight": "400"
                }
            ],
            "body-sm": [
                "14px",
                {
                    "lineHeight": "20px",
                    "fontWeight": "400"
                }
            ],
            "body-sm-strong": [
                "14px",
                {
                    "lineHeight": "20px",
                    "fontWeight": "600"
                }
            ],
            "body-md": [
                "16px",
                {
                    "lineHeight": "24px",
                    "fontWeight": "400"
                }
            ],
            "headline-sm": [
                "20px",
                {
                    "lineHeight": "28px",
                    "fontWeight": "600"
                }
            ],
            "headline-md": [
                "24px",
                {
                    "lineHeight": "32px",
                    "fontWeight": "600"
                }
            ],
            "headline-lg": [
                "32px",
                {
                    "lineHeight": "40px",
                    "letterSpacing": "-0.01em",
                    "fontWeight": "600"
                }
            ],
            "headline-display": [
                "40px",
                {
                    "lineHeight": "52px",
                    "letterSpacing": "-0.02em",
                    "fontWeight": "300"
                }
            ],
            "display-xl": [
                "56px",
                {
                    "letterSpacing": "-0.02em",
                    "fontWeight": "300"
                }
            ],
            "stat-value": [
                "36px",
                {
                    "lineHeight": "44px",
                    "letterSpacing": "-0.01em",
                    "fontWeight": "600"
                }
            ],
            "label-caps": [
                "11px",
                {
                    "lineHeight": "14px",
                    "letterSpacing": "0.08em",
                    "fontWeight": "600"
                }
            ]
        },
        "borderRadius": {
            "none": "0px",
            "sm": "0px",
            "md": "0px",
            "lg": "0px",
            "full": "9999px"
        },
        "spacing": {
            "base": "8px",
            "xs": "4px",
            "sm": "8px",
            "md": "16px",
            "lg": "24px",
            "xl": "48px",
            "gutter": "16px",
            "margin": "24px",
            "margin-mobile": "16px",
            "baseline": "24px",
            "touch-target": "48px",
            "stat-card-min": "240px",
            "table-row-height": "56px"
        }
    }
  },
  plugins: [],
};

export default config;
