# Security Model & Threat Assessment

## 🛡️ Philosophy: "Pixels over Objects"

The core security thesis of Sentinel PDF is that **PDFs should be treated as software, not documents**. They contain a Turing-complete language (PostScript/JavaScript) and support complex embedding.

To mitigate this, Sentinel enforces a **"Pixels over Objects"** policy: the user never interacts with the PDF objects directly, only with a rasterized image of them.

## Threat Model

We protect against the following specific PDF-borne vectors:

| Threat Vector | Mechanism | Mitigation in Sentinel |
| :--- | :--- | :--- |
| **JavaScript Injection** | Code embedded in `/JS` tags executes on open. | `pdf.js` script execution is disabled; Canvas rendering strips interactivity. |
| **Launch Actions** | PDF triggers external EXE (`cmd.exe`, PowerShell). | Heuristic scanner flags `/Launch` tags; Renderer ignores action dictionaries. |
| **URI/Phishing** | Hidden or spoofed links overlaid on text. | Links are non-clickable in Canvas mode. Static analysis flags high URI counts. |
| **Heap Spraying** | Malicious fonts/images manipulate memory. | Parsing occurs in a Web Worker; Sandbox environment limits access to main thread memory. |
| **Form Data Exfiltration** | PDFs attempting to POST data to C2 servers. | Network requests are blocked within the renderer context. |

## Sandbox Implementation Details

The `SecurePDFViewer` component implements isolation via:

1.  **Canvas API**: The `canvas` element is a bitmap. It does not support the DOM event bubbling model that XSS exploits rely on.
2.  **No Text Layer**: We deliberately do not render the `TextLayer` div that PDF.js usually generates for text selection. This prevents "invisible text" attacks.
3.  **Strict Content Security Policy (Implicit)**: Since the viewer is a React component, it adheres to the app's CSP. The PDF parser loads no external resources (fonts, images) from the web; it only processes the provided `ArrayBuffer`.

## Known Limitations

*   **Browser Vulnerabilities**: If the underlying browser's Canvas API or Web Crypto API has a vulnerability, Sentinel is affected.
*   **Parser Exploits**: While `pdf.js` is secure, a sufficiently malformed PDF aimed specifically at the parser's logic could potentially cause a denial of service (crash the tab).
*   **Mock Data**: In "Mock Mode", the app provides zero real protection regarding Reputation checks.

## Reporting Vulnerabilities

If you find a bypass that allows code execution from a PDF within the Sentinel environment, please report it immediately.