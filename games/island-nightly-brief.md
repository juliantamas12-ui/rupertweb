# Nightly Update Brief - 2026-03-26 22:39

## Priority fixes
1. 4x pixel count for better graphics (increase canvas res, scale CSS)
2. Scroll to zoom in/out (wheel event changes TSIZE equivalent scale)
3. Smoother movement (lerp/acceleration instead of instant velocity)
4. Enemies only aggro when player is within 120px (not 300px)
5. Hover highlight - mouse-over shows object outline
6. Less random jungle deaths - remove remaining pit traps, make dark jungle just dark

## Survival improvements
- Building becomes more necessary - no shelter = health drain at night
- Campfire needed to cook AND stay warm at night
- Water sources (natural pools) that can be drunk from directly

## Polish
- Ambient sound via Web Audio (ocean, birds, fire crackle)
- Fish variety with rare catches
- NPC relationship tracker (helped them = better rewards)
- Enemy AI: scouts patrol, retreat at low HP, call nearby enemies when alerted

## My additions
- Boss creature before chief (corrupted tribal guardian at volcano)
- Hidden secrets: 3 coded stone tablets that together reveal a secret
- Proper world map (M key) showing explored areas
- Dynamic weather: rain, storm, clear - each affects gameplay

## Notes
- Keep toolSlots2 loop in updateUI - keep checking it does not get dropped
- Keep player-distance based interaction (not click position)
- Keep NPCs within 40px of home
- Guard against undefined enemy crashes
- Check syntax before every push
