import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/analyze
 * Receives base64 image data, sends it to either Google Gemini 1.5 Flash
 * or OpenAI gpt-4o-mini depending on which API key is configured.
 * Falls back to simulated local analysis if no keys are found.
 */
async function getBase64Image(img: { image?: string; mimeType?: string; url?: string }) {
  if (img.url && img.url.startsWith("http")) {
    const res = await fetch(img.url);
    if (!res.ok) throw new Error(`Failed to fetch image from URL: ${img.url}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    return {
      base64: buffer.toString("base64"),
      mimeType
    };
  } else if (img.image) {
    return {
      base64: img.image,
      mimeType: img.mimeType || "image/jpeg"
    };
  }
  throw new Error("Invalid image format");
}

export async function POST(request: NextRequest) {
  let geminiStatus = "";
  let openaiStatus = "";

  try {
    const body = await request.json();
    const { image, mimeType, foodName, category, images } = body;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    let inputImages: any[] = [];
    if (images && Array.isArray(images)) {
      inputImages = images;
    } else if (image) {
      inputImages = [{ image, mimeType }];
    }

    const parsedImages: { base64: string; mimeType: string }[] = [];
    for (const img of inputImages) {
      try {
        const parsed = await getBase64Image(img);
        parsedImages.push(parsed);
      } catch (err) {
        console.error("Failed to parse/fetch image:", err);
      }
    }

    const hasImages = parsedImages.length > 0;

    const prompt = `Identify the food product in these images and suggest a clear, concise name for it in Indonesian (e.g., 'Roti Tawar Misis', 'Nasi Goreng Telur', 'Sayur Bayam'). 
    CRITICAL: The "foodName" key in JSON response MUST always be populated with a valid non-empty string. If the food is spoiled, mixed scraps, or waste, name it appropriately (e.g., 'Sisa Kulit Buah', 'Campuran Sisa Makanan', 'Sayuran Layu/Basi'). Never return an empty string or null for "foodName".
    Classify it into one of these exact categories: 'Makanan Matang', 'Roti/Bakery', 'Buah Potong', 'Sayuran', 'Bahan Segar', 'Pakan/Kompos', 'Lainnya'. 
    Suggest the estimated shelf life/safe consumption window in hours (as a number). 
    Suggest storage condition as either 'suhu_ruang' (room temperature) or 'kulkas' (refrigerated). 
    Determine the physical freshness status as one of: 'safe' (fresh, safe to eat), 'urgent' (still okay but needs to be distributed/consumed very quickly), or 'non-consumption' (spoiled, stale, or questionable, only for non-consumption uses like compost).
    Provide a short analysis statement in Indonesian explaining the freshness condition and recommendation. CRITICAL: If the freshness status is 'non-consumption', NEVER suggest throwing it away or discarding it (jangan sarankan dibuang). Instead, recommend diverting it for animal feed, maggot cultivation, or composting (sarankan dialihkan untuk pakan hewan, maggot, atau pembuatan pupuk kompos).
    Respond ONLY in JSON format: { "foodName": "Suggested Name", "category": "CategoryName", "estimatedHours": "Number", "storageCondition": "suhu_ruang|kulkas", "freshnessStatus": "safe|urgent|non-consumption", "aiAnalysis": "Indonesian statement", "confidence": Number }`;

    // 1. Try Google Gemini API first if key exists (falls back to other models sequentially)
    if (geminiApiKey && hasImages) {
      const geminiModels = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b"
      ];

      for (const modelName of geminiModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

          const parts: any[] = [{ text: prompt }];
          for (const img of parsedImages) {
            parts.push({
              inlineData: {
                mimeType: img.mimeType,
                data: img.base64,
              },
            });
          }

          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts,
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
          });

          if (response.ok) {
            const resJson = await response.json();
            const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
              console.log("[AI API Analyze] Raw Response Text:", text);
              const parsed = JSON.parse(text);
              console.log("[AI API Analyze] Parsed JSON:", parsed);
              return NextResponse.json({
                success: true,
                foodName: parsed.foodName || parsed.food_name || parsed.name || parsed.nama_makanan || parsed.nama || "",
                category: parsed.category || category || "Makanan Matang",
                estimatedHours: String(parsed.estimatedHours ?? parsed.estimated_hours ?? parsed.shelf_life ?? parsed.expiry ?? "6"),
                storageCondition: parsed.storageCondition || parsed.storage_condition || parsed.storage || "suhu_ruang",
                freshnessStatus: parsed.freshnessStatus || parsed.freshness_status || parsed.freshness || "safe",
                aiAnalysis: parsed.aiAnalysis || "Kondisi terdeteksi aman untuk didistribusikan.",
                confidence: parsed.confidence || 95,
                realAI: true,
                provider: `Gemini (${modelName})`,
              });
            }
          } else {
            const errText = await response.text();
            console.warn(`[Gemini model ${modelName} failed]`, response.status, errText);
            geminiStatus += `${modelName}: ${response.status} ${response.statusText}; `;
          }
        } catch (modelErr: any) {
          console.error(`Error trying Gemini model ${modelName}:`, modelErr);
          geminiStatus += `${modelName}: Error ${modelErr.message}; `;
        }
      }
    }

    // 2. Try OpenAI API if key exists and Gemini was not used
    if (openaiApiKey && hasImages) {
      const content: any[] = [
        {
          type: "text",
          text: prompt,
        },
      ];
      for (const img of parsedImages) {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${img.mimeType};base64,${img.base64}`,
          },
        });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content,
            },
          ],
        }),
      });

      if (response.ok) {
        const resJson = await response.json();
        const responseContent = resJson.choices?.[0]?.message?.content;
        if (responseContent) {
          console.log("[AI API Analyze OpenAI] Raw Response Content:", responseContent);
          const parsed = JSON.parse(responseContent);
          console.log("[AI API Analyze OpenAI] Parsed JSON:", parsed);
          return NextResponse.json({
            success: true,
            foodName: parsed.foodName || parsed.food_name || parsed.name || parsed.nama_makanan || parsed.nama || "",
            category: parsed.category || category || "Makanan Matang",
            estimatedHours: String(parsed.estimatedHours ?? parsed.estimated_hours ?? parsed.shelf_life ?? parsed.expiry ?? "6"),
            storageCondition: parsed.storageCondition || parsed.storage_condition || parsed.storage || "suhu_ruang",
            freshnessStatus: parsed.freshnessStatus || parsed.freshness_status || parsed.freshness || "safe",
            aiAnalysis: parsed.aiAnalysis || "Kondisi terdeteksi aman untuk didistribusikan.",
            confidence: parsed.confidence || 95,
            realAI: true,
            provider: "OpenAI",
          });
        }
      } else {
        openaiStatus = `${response.status} ${response.statusText}`;
        const errText = await response.text();
        console.error("[OpenAI API Error]", response.status, errText);
      }
    }

    // 3. Fallback to smart simulated classification
    let suggestedName = foodName || "";
    let suggestedCategory = category || "Makanan Matang";
    let suggestedHours = "6";
    let suggestedStorage = "suhu_ruang";
    let suggestedFreshness = "safe";
    let aiAnalysis = "";
    let confidence = 92;

    const nameLower = (foodName || "").toLowerCase();

    if (
      nameLower.includes("basi") ||
      nameLower.includes("busuk") ||
      nameLower.includes("jamur") ||
      nameLower.includes("kadaluwarsa") ||
      nameLower.includes("expired")
    ) {
      suggestedName = foodName || "Sisa Pangan Rusak";
      suggestedCategory = "Lainnya";
      suggestedHours = "0";
      suggestedStorage = "suhu_ruang";
      suggestedFreshness = "non-consumption";
      aiAnalysis = "Makanan terdeteksi sudah membusuk, berjamur, atau basi. Tidak layak dikonsumsi manusia. Direkomendasikan untuk dialihkan menjadi pakan hewan, maggot, atau pembuatan pupuk kompos.";
      confidence = 94;
    } else if (
      nameLower.includes("roti") ||
      nameLower.includes("bakery") ||
      nameLower.includes("donat") ||
      nameLower.includes("kue") ||
      nameLower.includes("pastry")
    ) {
      suggestedName = foodName || "Roti Manis";
      suggestedCategory = "Roti/Bakery";
      suggestedHours = "12";
      suggestedStorage = "suhu_ruang";
      suggestedFreshness = "safe";
      aiAnalysis = "Tekstur luar roti/kue terdeteksi masih lembut dan renyah. Tidak tampak adanya tanda pengerasan permukaan, kelembapan berlebih, atau bintik jamur. Sangat layak didistribusikan.";
      confidence = 96;
    } else if (
      nameLower.includes("pisang") ||
      nameLower.includes("buah") ||
      nameLower.includes("apel") ||
      nameLower.includes("semangka") ||
      nameLower.includes("jeruk") ||
      nameLower.includes("mangga")
    ) {
      suggestedName = foodName || "Aneka Buah Potong";
      suggestedCategory = "Buah Potong";
      suggestedHours = "4";
      suggestedStorage = "kulkas";
      suggestedFreshness = "urgent";
      aiAnalysis = "Deteksi buah potong terindikasi mengalami oksidasi ringan di permukaan (kecokelatan tipis). Kandungan air masih cukup tinggi. Disarankan disimpan dalam kulkas dan segera didistribusikan dalam 4 jam.";
      confidence = 89;
    } else if (
      nameLower.includes("bayam") ||
      nameLower.includes("sayur") ||
      nameLower.includes("wortel") ||
      nameLower.includes("kangkung") ||
      nameLower.includes("tomat") ||
      nameLower.includes("sawi")
    ) {
      suggestedName = foodName || "Sayuran Segar";
      suggestedCategory = "Sayuran";
      suggestedHours = "18";
      suggestedStorage = "kulkas";
      suggestedFreshness = "safe";
      aiAnalysis = "Serat daun sayuran terdeteksi tegak dan segar, warna hijau merata tanpa bercak layu yang parah. Kadar air selular optimal. Layak dikonsumsi dan aman diolah hingga 18 jam ke depan.";
      confidence = 94;
    } else if (
      nameLower.includes("daging") ||
      nameLower.includes("ayam") ||
      nameLower.includes("ikan") ||
      nameLower.includes("susu") ||
      nameLower.includes("telur") ||
      nameLower.includes("seafood")
    ) {
      suggestedName = foodName || "Bahan Protein Segar";
      suggestedCategory = "Bahan Segar";
      suggestedHours = "8";
      suggestedStorage = "kulkas";
      suggestedFreshness = "safe";
      aiAnalysis = "Bahan pangan segar berprotein tinggi mendeteksi kelembapan permukaan normal, aroma segar (terindeks dari warna daging cerah). Wajib disimpan di lemari pendingin (cold chain) untuk menghambat bakteri.";
      confidence = 91;
    } else {
      suggestedName = foodName || "Nasi Lauk Pauk";
      suggestedCategory = "Makanan Matang";
      suggestedHours = "4";
      suggestedStorage = "suhu_ruang";
      suggestedFreshness = "safe";
      aiAnalysis = "Makanan siap saji / matang terdeteksi dikemas dengan baik. Kondisi fisik lauk dan nasi tampak stabil. Batas aman sebelum pertumbuhan mikroba dimulai adalah 4 jam pada suhu ruang.";
      confidence = 87;
    }

    let errorDetails = "";
    if (geminiApiKey && geminiStatus) {
      errorDetails += `Gemini Error ${geminiStatus}. `;
    } else if (!geminiApiKey) {
      errorDetails += `Gemini Key tidak disetel. `;
    }
    if (openaiApiKey && openaiStatus) {
      errorDetails += `OpenAI Error ${openaiStatus}. `;
    } else if (!openaiApiKey) {
      errorDetails += `OpenAI Key tidak disetel. `;
    }

    return NextResponse.json({
      success: true,
      foodName: suggestedName,
      category: suggestedCategory,
      estimatedHours: suggestedHours,
      storageCondition: suggestedStorage,
      freshnessStatus: suggestedFreshness,
      aiAnalysis,
      confidence,
      realAI: false,
      errorDetails,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
