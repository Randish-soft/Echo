// frontend/app/api/generate-pdf/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { content } = await request.json();
    
    // In a real implementation, you would use a PDF generation library
    // For now, we'll return a simple HTML response that can be printed as PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Documentation</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 40px; 
              line-height: 1.6;
              color: #333;
            }
            h1 { 
              border-bottom: 3px solid #2c5aa0; 
              padding-bottom: 10px; 
              color: #2c5aa0;
            }
            h2 { 
              border-bottom: 1px solid #ddd; 
              padding-bottom: 5px; 
              color: #2c5aa0;
              margin-top: 30px;
            }
            h3 { color: #555; }
            pre { 
              background: #f8f9fa; 
              padding: 15px; 
              border-radius: 5px; 
              border-left: 4px solid #2c5aa0;
              overflow-x: auto;
            }
            code { 
              background: #f8f9fa; 
              padding: 2px 6px; 
              border-radius: 3px; 
              font-family: 'Courier New', monospace;
            }
            blockquote {
              border-left: 4px solid #ddd;
              margin: 20px 0;
              padding-left: 20px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              h1 { page-break-before: always; }
              h2 { page-break-after: avoid; }
              pre { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div>${convertMarkdownToHtml(content)}</div>
        </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="documentation.html"'
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function convertMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/&lt;(.*?)&gt;/g, '<$1>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/<\/p><p>/g, '</p>\n<p>');
}