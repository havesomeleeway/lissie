export async function POST(req) {
    const body = await req.json();
    const { topic } = body;

    const prompts = {
        Housing: [
            "Are you looking to buy an HDB flat or private property in Singapore?",
            "Do you have questions about CPF Housing Grants?",
        ],
        "Personal Finance": [
            "Do you need advice on budgeting or saving in Singapore?",
            "Are you interested in CPF contributions and usage?",
        ],
        Pregnancy: [
            "Do you have questions about maternity leave or benefits in Singapore?",
            "Would you like tips on prenatal care resources?",
        ],
        "Personal Health": [
            "Would you like advice on maintaining a healthy lifestyle in Singapore?",
            "Do you need guidance on mental health resources?",
        ],
    };

    return Response.json({ prompts: prompts[topic] || ["What would you like to discuss?"] });
}
