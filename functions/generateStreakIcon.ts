import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Generate a cartoon-style flame icon
    const prompt = "A cute, cartoon-style animated flame icon with big friendly eyes and a smile. Bright orange, yellow, and red colors with smooth round shapes. The flame has a friendly face with closed happy eyes and a warm smile. Transparent background. Simple, vector-like style with no white background. Size: 1024x1024px, centered, simple and cheerful design.";

    const imageResponse = await base44.integrations.Core.GenerateImage({
      prompt: prompt
    });

    return Response.json(imageResponse);
  } catch (error) {
    console.error('Error generating streak icon:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});