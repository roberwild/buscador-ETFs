import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';
import axios from 'axios';

// Define response type for better type safety
type AnalysisResponse = 
  | { success: true; data: any } 
  | { success: false; error: string };

// Mock function for PDF extraction instead of using pdfjs-dist directly
// This avoids the DOMMatrix error in Node.js environment
async function extractTextFromPDF(url: string): Promise<string> {
  try {
    if (!url || url.trim() === '') {
      return '';
    }
    
    console.log(`Server: PDF URL provided, but skipping extraction due to environment compatibility issues`);
    // Instead of actually parsing the PDF, return a placeholder message
    // This is a safer approach until we can implement proper PDF extraction in production
    return `PDF extraction skipped: ${url}`;
  } catch (error) {
    console.error(`Server: Error with PDF URL: ${error}`);
    return '';
  }
}

export const analysisRouter = router({
  analyzeFunds: publicProcedure
    .input(
      z.object({
        funds: z.array(
          z.object({
            name: z.string(),
            isin: z.string(),
            category: z.string(),
            currency: z.string(),
            risk_level: z.string(),
            ytd_return: z.number(),
            one_year_return: z.number(),
            three_year_return: z.number(),
            five_year_return: z.number(),
            management_fee: z.number(),
            management_company: z.string(),
            focus_list: z.string().optional(),
            dividend_policy: z.string().optional(),
            factsheet_url: z.string().optional().nullable(),
            kiid_url: z.string().optional().nullable(),
          })
        ),
      })
    )
    .mutation(async ({ input }): Promise<AnalysisResponse> => {
      try {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
          throw new Error("OpenAI API key not found in environment variables.");
        }

        // Create model instance with server-side API key
        const model = new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: "gpt-4o",
          temperature: 0.2,
        });
        
        // Format basic fund data, skipping PDF extraction for now
        const fundsDataFormatted = input.funds.map(fund => ({
          name: fund.name,
          isin: fund.isin,
          category: fund.category,
          currency: fund.currency,
          risk_level: fund.risk_level,
          ytd_return: fund.ytd_return,
          one_year_return: fund.one_year_return,
          three_year_return: fund.three_year_return,
          five_year_return: fund.five_year_return,
          management_fee: fund.management_fee,
          management_company: fund.management_company,
          focus_list: fund.focus_list,
          dividend_policy: fund.dividend_policy === 'C' ? 'Acumulación' : 'Distribución',
          has_factsheet: fund.factsheet_url ? "Sí" : "No",
          has_kiid: fund.kiid_url ? "Sí" : "No"
        }));
        
        // Format funds data as string
        const fundsDataString = JSON.stringify(fundsDataFormatted, null, 2);
        
        // Create prompt template with properly escaped curly braces
        const template = ChatPromptTemplate.fromMessages([
          HumanMessagePromptTemplate.fromTemplate(
            `You are an expert fund analyst with deep knowledge of ETFs and investment funds. 
            Analyze the following funds and provide insightful analysis:
            
            {fundsData}
            
            Generate a comprehensive analytical report with the following sections:
            
            1. SUMMARY:
            - Key takeaways about the selected funds
            - Overall allocation strategy represented by these funds
            - Strengths and weaknesses of the portfolio
            - Which funds stand out (positively or negatively) and why
            
            2. ALLOCATION:
            - Suggested optimal allocation percentages (for a theoretical investor)
            - Rationale for your allocation recommendations
            - Provide allocation percentages for each fund in JSON format for visualization
            
            3. RISK_ANALYSIS:
            - Risk assessment of the portfolio
            - Diversification analysis
            - Historical performance patterns
            - Which categories and risk classes are represented
            - Risk-weighted return analysis (information ratio)
            
            4. FUTURE_OUTLOOK:
            - Expected future performance given current market conditions
            - Recommendations for portfolio adjustments
            - Potential alternative funds worth considering
            
            Format your response in JSON. Here is an example format:
            
            {{
              "summary": {{
                "overview": "texto de ejemplo",
                "keyTakeaways": ["punto 1", "punto 2"],
                "topPerformers": ["fondo 1", "fondo 2"],
                "underperformers": ["fondo 1", "fondo 2"],
                "strengths": ["fortaleza 1", "fortaleza 2"],
                "weaknesses": ["debilidad 1", "debilidad 2"]
              }},
              "allocation": {{
                "overview": "texto de ejemplo",
                "percentages": [
                  {{"name": "Nombre del fondo", "isin": "ISIN", "value": 25, "rationale": "Razón de esta asignación"}}
                ],
                "strategy": "texto de ejemplo",
                "rationale": "texto de ejemplo"
              }},
              "riskAnalysis": {{
                "overview": "texto de ejemplo",
                "diversification": "texto de ejemplo",
                "riskScore": 65,
                "riskBreakdown": [
                  {{"name": "Bajo riesgo", "value": 25}},
                  {{"name": "Riesgo moderado", "value": 50}},
                  {{"name": "Alto riesgo", "value": 25}}
                ],
                "categoryBreakdown": [
                  {{"name": "Nombre de categoría", "value": 45}},
                  {{"name": "Nombre de categoría", "value": 55}}
                ],
                "weaknesses": ["riesgo 1", "riesgo 2"],
                "strengths": ["fortaleza 1", "fortaleza 2"]
              }},
              "futureOutlook": {{
                "overview": "texto de ejemplo",
                "projections": [
                  {{"name": "6 meses", "value": 3.2}},
                  {{"name": "1 año", "value": 5.1}},
                  {{"name": "3 años", "value": 12.4}}
                ],
                "recommendations": ["recomendación 1", "recomendación 2"],
                "alternatives": ["alternativa 1", "alternativa 2"]
              }}
            }}
            
            Ensure all text is in Spanish and all numbers and values are reasonable based on the funds data.
            Make sure your JSON is valid and properly formatted.`
          )
        ]);

        // Create the chain
        const chain = template.pipe(model).pipe(new StringOutputParser());

        // Execute the chain and get response
        console.log("Server: Executing OpenAI request...");
        const result = await chain.invoke({
          fundsData: fundsDataString,
        });
        console.log("Server: OpenAI response received");

        try {
          // Process the result - handle both raw JSON and JSON wrapped in markdown code blocks
          let jsonContent = result;
          
          // Check if the result is wrapped in markdown code blocks
          const codeBlockMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            jsonContent = codeBlockMatch[1].trim();
            console.log("Server: Extracted JSON from markdown code block");
          }
          
          // Parse JSON response
          const analysis = JSON.parse(jsonContent);
          return { success: true, data: analysis };
        } catch (parseError) {
          console.error("Server: JSON parse error:", parseError);
          return { success: false, error: "Error parsing OpenAI response. Please try again." };
        }
      } catch (error: any) {
        console.error("Server: Analysis generation error:", error);
        
        let errorMessage = "Error generating analysis.";
        if (error.message) {
          errorMessage = error.message;
        }
        
        return { 
          success: false, 
          error: errorMessage
        };
      }
    }),
}); 