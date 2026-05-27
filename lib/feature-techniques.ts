// Per-feature technique recommendations.
// Sourced from ADD_RESEARCH §3 (Feature-Specific Makeup Techniques).
// Each technique is framed as "enhance / try", never "fix / slim / shrink".

import type { EyeShape, FaceShape, LipShape, NoseType, BrowShape } from "./types";

export interface Technique {
  name: string;
  description: string;
}

// ─── EYELINER per EYE SHAPE (ADD_RESEARCH §3a) ─────────────────────────────
export const EYELINER_TECHNIQUE: Record<EyeShape, Technique> = {
  "Almond": {
    name: "Classic winged liner",
    description: "Your shape gives a natural lift. A clean wing along the upper lash line works beautifully.",
  },
  "Round": {
    name: "Outward-elongating liner",
    description: "Extend liner outward along the upper lash line and push the wing horizontally to elongate the eye.",
  },
  "Monolid": {
    name: "Tightline + thin lash-hugging line",
    description: "Tightline the upper waterline and draw a thin line very close to the lash root. Build gradually to avoid transfer.",
  },
  "Hooded monolid": {
    name: "Tightline with eyes-open wing",
    description: "Combine a tight upper waterline with a small wing drawn with the eye open, sitting just above the hooded fold.",
  },
  "Parallel double-lid": {
    name: "Soft lid wash with thin liner",
    description: "Standard placement works beautifully. Try a thin liner that follows the lash root then extends slightly past the outer corner.",
  },
  "Outer double-lid": {
    name: "Outer-emphasis liner",
    description: "Concentrate liner thickness and the wing in the outer third where your crease is most visible.",
  },
  "Hooded": {
    name: "Above-crease liner",
    description: "Draw the liner above the natural crease so it stays visible when your eyes are open. Mark with eyes open, fill with eyes closed.",
  },
  "Downturned": {
    name: "Lift-style wing",
    description: "Stop the liner short of the outer corner and angle the wing upward well before the natural eye end. Lifts the gaze.",
  },
  "Upturned": {
    name: "Built-in cat eye",
    description: "Your shape already lifts. Line both top and bottom lash lines equally to balance, or skip the wing entirely.",
  },
  "Deep-set": {
    name: "Light hand, no heavy upper liner",
    description: "Keep liner thin to avoid recessing your eyes further. Soft brown can work better than harsh black.",
  },
};

// ─── EYESHADOW PLACEMENT per EYE SHAPE (ADD_RESEARCH §3b) ──────────────────
export const EYESHADOW_TECHNIQUE: Record<EyeShape, Technique> = {
  "Almond": {
    name: "Classic placement",
    description: "Lid colour, crease shade, outer V, and inner-corner highlight all sit naturally on your shape.",
  },
  "Round": {
    name: "Outer-corner darkening",
    description: "Darken the outer corner to elongate the eye horizontally.",
  },
  "Monolid": {
    name: "Horizontal gradient",
    description: "Build a gradient upward from the lash line: darkest at the lash, mid through the middle, lightest near the brow. Skip Western crease-blending.",
  },
  "Hooded monolid": {
    name: "Lash-line-hugging depth",
    description: "Keep matte depth close to the lash line. Add a shimmer wash that stays visible with eyes open.",
  },
  "Parallel double-lid": {
    name: "Standard Western placement",
    description: "Lid colour, crease shade, brow-bone highlight all read clearly because your crease is fully visible.",
  },
  "Outer double-lid": {
    name: "Outer-third crease colour",
    description: "Concentrate crease colour in the outer third. Inner third can stay clean since there's no visible crease there.",
  },
  "Hooded": {
    name: "Above-crease placement",
    description: "Place transition and crease shades above the natural crease so they show with eyes open. Cut-crease can simulate a fold.",
  },
  "Downturned": {
    name: "Lifted outer corner",
    description: "Angle outer-corner shadow upward to counter the natural drop. Avoid heavy darkness at the outer drop point.",
  },
  "Upturned": {
    name: "Balanced placement",
    description: "Standard lid colour works. Add depth on the lower outer corner to balance the natural lift.",
  },
  "Deep-set": {
    name: "Light shimmer on lid",
    description: "Light or shimmer shades on the lid bring the eye forward. Avoid darkness through the crease.",
  },
};

// ─── BLUSH PLACEMENT per FACE SHAPE (ADD_RESEARCH §3f) ─────────────────────
export const BLUSH_TECHNIQUE: Record<FaceShape, Technique> = {
  "Oval": {
    name: "Apples or cheekbones",
    description: "You have the most flexibility. Apples for youthful, top of cheekbones for sculpted.",
  },
  "Round": {
    name: "High diagonal sweep",
    description: "High on the cheekbones, diagonal up toward the temples. Lifts and elongates.",
  },
  "Square": {
    name: "Apples, blended outward",
    description: "Sit blush on the apples and blend outward to soften the jaw line.",
  },
  "Heart": {
    name: "C-shape from cheek to brow",
    description: "Carry blush in a C-shape from the top of the cheekbone up toward the brow tail. Softens the forehead width.",
  },
  "Diamond": {
    name: "Tops of cheekbones",
    description: "Place blush on the highest part of the cheekbones and blend outward. Don't push too far in.",
  },
  "Oblong": {
    name: "Horizontal sweep across apples",
    description: "Sweep horizontally across the apples to add width and visually shorten the face.",
  },
  "Triangle": {
    name: "Apples with upward sweep",
    description: "Apples with a slight upward sweep. Balances a wider jaw.",
  },
};

// ─── CONTOUR per FACE SHAPE (ADD_RESEARCH §3e) ─────────────────────────────
export const CONTOUR_TECHNIQUE: Record<FaceShape, Technique> = {
  "Oval": {
    name: "Minimal",
    description: "Optional light shading in the hollows of the cheeks. Your shape is already balanced.",
  },
  "Round": {
    name: "Cheek hollows + temples + jaw sides",
    description: "Shade the hollows under the cheekbones, temples, and sides of the jaw to elongate.",
  },
  "Square": {
    name: "Forehead corners + jaw angles",
    description: "Soften the forehead corners and jaw angles. Adds curve to angular lines.",
  },
  "Heart": {
    name: "Forehead sides + chin point",
    description: "Shade the sides of the forehead and the chin point to balance a wider forehead with a narrower chin.",
  },
  "Diamond": {
    name: "Forehead corners + chin",
    description: "Subtle shading at the forehead corners and chin point softens the diamond's narrow points.",
  },
  "Oblong": {
    name: "Top of forehead + under chin",
    description: "Shade the top of the forehead at the hairline and under the chin to visually shorten.",
  },
  "Triangle": {
    name: "Sides of jaw",
    description: "Soften the sides of the jaw. Light highlight at temples adds width up top.",
  },
};

// ─── LIP TECHNIQUE per LIP SHAPE (ADD_RESEARCH §3i) ────────────────────────
export const LIP_TECHNIQUE: Record<LipShape, Technique> = {
  "Full": {
    name: "Define and let them speak",
    description: "Define the natural lip line. Your shape carries bold colours and matte finishes beautifully.",
  },
  "Thin": {
    name: "Gentle overline + glossy centre",
    description: "Overline 1-2mm above the natural line in a shade that matches your lipstick, not your skin. Add a glossy centre for fullness.",
  },
  "Heart-shaped": {
    name: "Emphasise the Cupid's bow",
    description: "Define the Cupid's bow. Do not overline the lower lip, that's what preserves the heart shape.",
  },
  "Bow-shaped": {
    name: "Precise bow + soft outer overline",
    description: "Trace the Cupid's bow precisely. Optionally overline the outer corners gently for added width.",
  },
  "Downturned": {
    name: "Stop short at the corners",
    description: "Stop the liner short of the natural corners. A touch of concealer at the corners lifts the look. Don't follow the downward curve.",
  },
  "Wide": {
    name: "Centre focus",
    description: "Focus colour and definition in the centre of the lip. Avoid carrying colour fully into the corners.",
  },
  "Round": {
    name: "Subtle corner shading",
    description: "Add light shading at the corners with a darker liner to give dimension to the round shape.",
  },
  "Top-heavy": {
    name: "Build the lower lip",
    description: "Use liner to gently build the lower lip until it visually balances the upper.",
  },
  "Bottom-heavy": {
    name: "Define the upper Cupid's bow",
    description: "Sharpen the upper Cupid's bow to draw the eye and balance against the fuller lower lip.",
  },
};

// ─── BROW SHAPING per FACE SHAPE (ADD_RESEARCH §3d) ────────────────────────
// Suggests an ideal brow approach given the face shape; user keeps own brow shape.
export const BROW_TECHNIQUE: Record<FaceShape, Technique> = {
  "Oval": {
    name: "Most shapes work",
    description: "A soft arch is universally flattering. Almost any brow shape suits an oval face.",
  },
  "Round": {
    name: "Soft high arch",
    description: "A soft high arch adds vertical lift and visually lengthens the face.",
  },
  "Square": {
    name: "Curved soft arch",
    description: "A curved soft arch softens the jaw angles. Avoid hard straight brows that echo the jaw line.",
  },
  "Heart": {
    name: "Rounded soft low arch",
    description: "Rounded, curved brows with a soft low arch balance a wider forehead.",
  },
  "Diamond": {
    name: "Curved with fuller heads",
    description: "Curved brows with fuller inner heads visually widen the forehead area.",
  },
  "Oblong": {
    name: "Straight K-brow",
    description: "A near-straight brow with soft tapering tail visually shortens an elongated face.",
  },
  "Triangle": {
    name: "Soft arch with fuller inner",
    description: "Fuller inner brow with a soft arch balances a wider jaw line.",
  },
};

// ─── NOSE ENHANCEMENT per NOSE TYPE (ADD_RESEARCH §3h) ─────────────────────
// Framing: "enhance / add dimension to", never "slim / fix".
export const NOSE_TECHNIQUE: Record<NoseType, Technique> = {
  "Button": {
    name: "Tip elongation",
    description: "Two small curved highlights around the tip add subtle elongation. Skip the long bridge contour.",
  },
  "Straight": {
    name: "Minimal contour",
    description: "Your bridge already has clean line. Light highlight down the centre is all that's needed.",
  },
  "Aquiline": {
    name: "Soften the bridge prominence",
    description: "Light contour over the bridge prominence and highlight above and below it adds graceful balance.",
  },
  "Snub": {
    name: "Bridge highlight to elongate",
    description: "Highlight the full bridge to elongate. Skip heavy contour at the sides.",
  },
  "Low-bridge": {
    name: "Targeted bridge definition",
    description: "Thin contour lines down the sides of the bridge starting at the inner brow. Light highlight down the centre. Avoid two parallel lines the full length.",
  },
  "Wide": {
    name: "Side and tip definition",
    description: "Light contour at the sides of the nostrils, blended toward centre. A small highlight on the tip adds dimension.",
  },
  "Long": {
    name: "Tip shortening",
    description: "A small triangle of contour at the tip visually shortens. Highlight only the upper half of the bridge.",
  },
  "Short": {
    name: "Full-bridge highlight",
    description: "Highlight the full bridge to elongate. Light contour along the sides adds shape.",
  },
};

// ─── BROW VISUAL HINT per BROW SHAPE (used in 'your features' card) ────────
// This describes what the user's brow already looks like, in respectful terms.
export const BROW_DESCRIPTOR: Record<BrowShape, string> = {
  "Straight": "Straight K-brow style, softens the face and reads youthful.",
  "Soft arch": "Soft natural arch, universally flattering and balanced.",
  "High arch": "Defined high arch, lifts and sharpens features.",
  "Rounded": "Rounded brow, softens angular features.",
  "Flat": "Flat low brow, calm and unfussy.",
};
