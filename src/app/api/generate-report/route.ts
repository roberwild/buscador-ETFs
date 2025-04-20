import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { funds } = await request.json();
    
    if (!funds || !Array.isArray(funds) || funds.length === 0) {
      return NextResponse.json(
        { error: 'No funds provided or invalid format' },
        { status: 400 }
      );
    }

    // Limit number of funds to process (to avoid overloading)
    const fundsToProcess = funds.slice(0, 5); // Process max 5 funds
    
    // Create basic info about the funds
    const fundsInfo = fundsToProcess.map(fund => ({
      isin: fund.isin,
      name: fund.name,
      category: fund.category,
      risk_level: fund.risk_level,
      management_company: fund.management_company,
      currency: fund.currency,
      ytd_return: `${fund.ytd_return.toFixed(2)}%`,
      one_year_return: `${fund.one_year_return.toFixed(2)}%`,
      three_year_return: `${fund.three_year_return.toFixed(2)}%`,
      five_year_return: `${fund.five_year_return.toFixed(2)}%`,
      management_fee: `${fund.management_fee.toFixed(2)}%`
    }));
    
    // PDF extraction attempt - this is simpler but may not work with complex PDFs
    const pdfContents = [];
    
    // Track PDF extraction attempts for debugging
    const extractionResults = [];
    
    for (const fund of fundsToProcess) {
      // Try to fetch factsheet PDF
      if (fund.factsheet_url) {
        try {
          extractionResults.push({
            fund: fund.isin,
            document: 'factsheet',
            status: 'Attempting to fetch',
            url: fund.factsheet_url
          });
          
          const response = await fetch(fund.factsheet_url);
          
          if (response.ok) {
            // Just capture metadata about the PDF since we can't easily extract content
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');
            
            pdfContents.push({
              fund: fund.name,
              document_type: 'factsheet',
              url: fund.factsheet_url,
              status: 'Available - see link for details',
              metadata: { contentType, contentLength }
            });
            
            extractionResults.push({
              fund: fund.isin,
              document: 'factsheet',
              status: 'Fetch successful',
              contentType,
              contentLength
            });
          } else {
            extractionResults.push({
              fund: fund.isin,
              document: 'factsheet',
              status: 'Fetch failed',
              statusCode: response.status
            });
          }
        } catch (error) {
          extractionResults.push({
            fund: fund.isin,
            document: 'factsheet',
            status: 'Error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Try to fetch KIID PDF
      if (fund.kiid_url) {
        try {
          extractionResults.push({
            fund: fund.isin,
            document: 'kiid',
            status: 'Attempting to fetch',
            url: fund.kiid_url
          });
          
          const response = await fetch(fund.kiid_url);
          
          if (response.ok) {
            // Just capture metadata about the PDF
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');
            
            pdfContents.push({
              fund: fund.name,
              document_type: 'KIID',
              url: fund.kiid_url,
              status: 'Available - see link for details',
              metadata: { contentType, contentLength }
            });
            
            extractionResults.push({
              fund: fund.isin,
              document: 'kiid',
              status: 'Fetch successful',
              contentType,
              contentLength
            });
          } else {
            extractionResults.push({
              fund: fund.isin,
              document: 'kiid',
              status: 'Fetch failed',
              statusCode: response.status
            });
          }
        } catch (error) {
          extractionResults.push({
            fund: fund.isin,
            document: 'kiid',
            status: 'Error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    console.log('Document extraction results:', JSON.stringify(extractionResults, null, 2));
    
    // Create prompt for OpenAI with all available information
    const systemPrompt = `
You are a financial advisor specialized in analyzing investment funds. 
You'll analyze the provided fund information and generate a comprehensive report including:

1. Key Fund Information: Summarize strategy, objectives, and target investors based on the fund category and data
2. Performance Analysis: Analyze returns in context of the fund's category and overall market conditions
3. Risk Assessment: Evaluate the risk level and whether it's appropriate for the fund's strategy
4. Fee Analysis: Assess whether the management fee is competitive for this fund category
5. Recommendations: Provide investment recommendations based on the fund's profile and performance

Structure your report with clear sections for each fund and a comparative analysis.
Format your response in Markdown for readability.
`;

    const userPrompt = `
Please analyze these investment funds and generate a comprehensive report:

Fund Information:
${JSON.stringify(fundsInfo, null, 2)}

Document Links (The PDFs could not be automatically processed, but here are the links if needed):
${JSON.stringify(pdfContents, null, 2)}

Please generate a detailed analysis based on the available numerical data. For each fund provide:
1. Analysis of performance metrics (YTD, 1yr, 3yr, 5yr returns)
2. Assessment of the risk level relative to the returns
3. Evaluation of the management fee
4. Comparative analysis between funds
5. Investment recommendations

Format the response as a professional investment report in Markdown.
`;

    // Call OpenAI directly with chat completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    // Get the generated report
    const report = completion.choices[0].message.content;
    
    // Return both the report and debugging info about document processing
    return NextResponse.json({ 
      report,
      debug: {
        extraction_attempts: extractionResults,
        pdf_metadata: pdfContents
      }
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: 'Failed to generate report', details: errorMessage },
      { status: 500 }
    );
  }
} 