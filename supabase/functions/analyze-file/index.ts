import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileType, dataType } = await req.json();
    
    if (!fileContent) {
      return new Response(
        JSON.stringify({ error: "File content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing ${dataType} data from ${fileType} file, content length: ${fileContent.length}`);

    const systemPrompt = dataType === "patients" 
      ? `You are a data extraction assistant for a medical eye bank system. Extract patient data from the provided file content which may contain data from multiple sheets.
         
         For each patient entry, extract ALL of these fields:
         - patient_name (string, required - the patient's full name)
         - age (number, required)
         - sex (one of: "Male", "Female", "Other")
         - eb_number (string, optional - Cornea clinic registration number, may be labeled as EB No., EB number, or similar)
         - address (string, optional - full address)
         - contact_numbers (array of strings - extract ALL phone numbers found for this patient)
         - diagnosis (string, optional - e.g., "Corneal Opacity", "Keratoconus", "Pseudophakic Bullous Keratopathy", etc.)
         - diagnosis_eye (one of: "RE" for Right Eye, "LE" for Left Eye, or null)
         - surgical_plan (string, optional - one of: "PK", "Tectonic PK", "TPK", "DSAEK", "DALK", "DMEK", "Others" - the planned surgery type)
         - surgery_eye (one of: "RE" for Right Eye, "LE" for Left Eye, or null)
         - iol_option (string, optional - one of: "with IOL", "without IOL", "±IOL")
         - operation_date (string in YYYY-MM-DD format, optional - the date when surgery was performed)
         - surgeon_name (string, optional - name of the surgeon who performed/will perform the surgery)
         - remarks (string, optional - any additional notes)
         
         IMPORTANT:
         - Extract ALL entries from ALL sheets provided
         - Extract ALL contact numbers for each patient (multiple numbers should be in the array)
         - Look for variations in column headers (e.g., "Pt. Name", "Patient Name", "Name")
         - Look for EB number variations: "EB No.", "EB Number", "Cornea Clinic No."
         - Look for WL number variations: "WL No.", "Waiting List", "WL Number"
         - Parse dates correctly to YYYY-MM-DD format
         - If surgery details include date and surgeon, extract them separately
         
         Return a JSON object with a "patients" array containing ALL extracted entries.`
      : `You are a data extraction assistant for a medical eye bank system. Extract donor data from the provided file content which may contain data from multiple sheets.
         
         For each donor, extract:
         - donor_name (string, required)
         - age (number, required)
         - sex (one of: "Male", "Female", "Other")
         - cause_of_death (string, optional)
         - retrieval_date (string in YYYY-MM-DD format, optional)
         - death_to_retrieval_hours (number, optional)
         - death_to_retrieval_minutes (number, optional)
         - eye_number_left (string, optional)
         - eye_number_right (string, optional)
         - address (string, optional)
         - source_of_awareness (string, optional)
         
         IMPORTANT: Extract ALL entries from ALL sheets provided.
         Return a JSON object with a "donors" array containing ALL extracted entries.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract ${dataType} data from this ${fileType} content (may contain multiple sheets):\n\n${fileContent}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: dataType === "patients" ? "extract_patients" : "extract_donors",
              description: `Extract ${dataType} data from the file`,
              parameters: dataType === "patients" 
                ? {
                    type: "object",
                    properties: {
                      patients: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            patient_name: { type: "string" },
                            age: { type: "number" },
                            sex: { type: "string", enum: ["Male", "Female", "Other"] },
                            eb_number: { type: "string" },
                            address: { type: "string" },
                            contact_numbers: { type: "array", items: { type: "string" } },
                            diagnosis: { type: "string" },
                            diagnosis_eye: { type: "string", enum: ["RE", "LE"] },
                            surgical_plan: { type: "string", enum: ["PK", "Tectonic PK", "TPK", "DSAEK", "DALK", "DMEK", "Others"] },
                            surgery_eye: { type: "string", enum: ["RE", "LE"] },
                            iol_option: { type: "string", enum: ["with IOL", "without IOL", "±IOL"] },
                            operation_date: { type: "string" },
                            surgeon_name: { type: "string" },
                            remarks: { type: "string" }
                          },
                          required: ["patient_name", "age", "sex"]
                        }
                      }
                    },
                    required: ["patients"]
                  }
                : {
                    type: "object",
                    properties: {
                      donors: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            donor_name: { type: "string" },
                            age: { type: "number" },
                            sex: { type: "string", enum: ["Male", "Female", "Other"] },
                            cause_of_death: { type: "string" },
                            retrieval_date: { type: "string" },
                            death_to_retrieval_hours: { type: "number" },
                            death_to_retrieval_minutes: { type: "number" },
                            eye_number_left: { type: "string" },
                            eye_number_right: { type: "string" },
                            address: { type: "string" },
                            source_of_awareness: { type: "string" }
                          },
                          required: ["donor_name", "age", "sex"]
                        }
                      }
                    },
                    required: ["donors"]
                  }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: dataType === "patients" ? "extract_patients" : "extract_donors" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No data extracted from file");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log(`Extracted ${dataType === 'patients' ? extractedData.patients?.length : extractedData.donors?.length} records`);
    
    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing file:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to analyze file" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
