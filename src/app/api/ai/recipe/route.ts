import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/recipe
 * Generates custom food rescue processing and recipe suggestions based on
 * the food name, category, and freshness status.
 */
export async function POST(request: NextRequest) {
  try {
    const { foodName, category, freshnessStatus } = await request.json();

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    const prompt = `You are a culinary expert in food waste reduction. 
    Suggest 3 creative ideas or recipes to process or reuse this surplus food in Indonesian.
    Product: "${foodName || "Makanan"}" (Category: "${category || "Makanan Matang"}", Status: "${freshnessStatus || "safe"}").
    The ideas should be highly practical, simple, and tailored to the product's safety status.
    If the status is "non-consumption", suggest safe composting, livestock feed, or organic waste processing methods instead of recipes.
    Return ONLY a raw text list format in Indonesian with 3 bullet points starting with '•'.`;

    // 1. Try Google Gemini API first (falls back to other models sequentially)
    if (geminiApiKey) {
      const geminiModels = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b"
      ];

      for (const modelName of geminiModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
            }),
          });

          if (response.ok) {
            const resJson = await response.json();
            const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return NextResponse.json({
                success: true,
                suggestions: text.trim(),
                realAI: true,
                provider: `Gemini (${modelName})`,
              });
            }
          } else {
            const errText = await response.text();
            console.warn(`[Gemini Recipe model ${modelName} failed]`, response.status, errText);
          }
        } catch (modelErr) {
          console.error(`Error trying Gemini Recipe model ${modelName}:`, modelErr);
        }
      }
    }

    // 2. Try OpenAI API
    if (openaiApiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (response.ok) {
        const resJson = await response.json();
        const content = resJson.choices?.[0]?.message?.content;
        if (content) {
          return NextResponse.json({
            success: true,
            suggestions: content.trim(),
            realAI: true,
          });
        }
      }
    }

    // 3. Fallback: Contextual rule-based ideas
    let suggestions = "";
    const nameLower = (foodName || "").toLowerCase();

    if (freshnessStatus === "non-consumption") {
      suggestions = 
        `• Pakan Ternak Mandiri: Rebus sisa makanan untuk disterilkan, lalu campurkan dengan dedak/bekatul sebagai pakan ayam atau bebek.\n` +
        `• Budidaya Maggot BSF: Tempatkan sisa makanan dalam wadah biokonversi maggot BSF untuk menghasilkan protein pakan berkualitas tinggi.\n` +
        `• Kompos Komposter Rumah Tangga: Cacah halus makanan dan campurkan ke dalam keranjang Takakura atau komposter bersama tanah untuk pupuk tanaman.`;
    } else if (
      nameLower.includes("roti") ||
      nameLower.includes("bakery") ||
      nameLower.includes("donat") ||
      nameLower.includes("kue")
    ) {
      suggestions = 
        `• Puding Roti Mentega: Iris roti sisa, susun di loyang, siram dengan campuran telur, susu, mentega, dan sedikit gula, lalu panggang hingga kecokelatan.\n` +
        `• Crouton Kering Renyah: Potong dadu roti, lumuri dengan minyak zaitun dan bawang putih bubuk, lalu panggang oven sebagai taburan sup hangat.\n` +
        `• Tepung Roti Praktis: Panggang roti hingga benar-benar kering keras, lalu haluskan dengan blender/chopper untuk pelapis gorengan/nugget.`;
    } else if (
      nameLower.includes("pisang") ||
      nameLower.includes("buah") ||
      nameLower.includes("apel") ||
      nameLower.includes("semangka")
    ) {
      suggestions = 
        `• Selai Buah Rumahan: Masak buah potong dengan gula pasir dan air perasan jeruk nipis di atas api kecil hingga mengental menjadi selai roti.\n` +
        `• Setup Buah Rempah: Rebus potongan buah bersama kayu manis, cengkeh, dan sedikit gula pasir. Sajikan hangat atau dingin sebagai hidangan pencuci mulut.\n` +
        `• Smoothie Protein Sehat: Blender buah bersama susu cair/yogurt dan es batu untuk minuman penyegar energi di sore hari.`;
    } else if (
      nameLower.includes("bayam") ||
      nameLower.includes("sayur") ||
      nameLower.includes("kangkung")
    ) {
      suggestions = 
        `• Bakwan Sayur Garing: Campurkan potongan sayur dengan tepung terigu, tepung beras, bawang putih, garam, air, lalu goreng hingga kering keemasan.\n` +
        `• Kaldu Sayur Organik: Rebus sayuran bersama bawang bombay, wortel, dan batang seledri selama 45 menit untuk kaldu dasar sup yang lezat.\n` +
        `• Omelet Sayur Gurih: Tumis sayur sebentar, campurkan ke dalam kocokan telur, tambahkan merica, goreng tebal di wajan dengan api kecil.`;
    } else {
      suggestions = 
        `• Nasi Goreng Spesial: Olah kembali nasi matang sisa dengan bumbu halus bawang merah, putih, cabai, kecap manis, dan tambahkan telur kocok.\n` +
        `• Casserole Kukus/Panggang: Campurkan makanan matang lauk dengan potongan kentang atau makaroni rebus, siram saus putih keju, lalu panggang.\n` +
        `• Kroket Kentang Isi Lauk: Hancurkan kentang rebus, isi bagian tengahnya dengan sisa lauk matang yang telah dicincang halus, lalu goreng.`;
    }

    return NextResponse.json({
      success: true,
      suggestions,
      realAI: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
