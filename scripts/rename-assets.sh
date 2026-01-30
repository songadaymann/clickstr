#!/bin/bash

# Asset Rename Script for Stupid Clicker
# Renames cursor PNGs and 1/1 NFT images to match expected formats
#
# Cursor format: cursors/{cursor-id}.png (e.g., bronze.png, rose-gold.png)
# NFT 1/1 format: nfts/{tier}.png (e.g., 200.png, 221.png)

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CURSORS_DIR="$SCRIPT_DIR/public/cursors"
NFTS_DIR="$SCRIPT_DIR/public/one-of-ones"

DRY_RUN=true
if [ "$1" == "--execute" ]; then
  DRY_RUN=false
fi

rename_file() {
  local dir="$1"
  local old="$2"
  local new="$3"

  if [ -f "$dir/$old" ]; then
    if [ "$DRY_RUN" == "false" ]; then
      mv "$dir/$old" "$dir/$new"
      echo "✓ $old → $new"
    else
      echo "  $old → $new"
    fi
  fi
}

echo "=== CURSOR RENAMES ==="
echo "Directory: $CURSORS_DIR"
echo ""

# Personal milestones (1-12)
# rename_file "$CURSORS_DIR" "001_*.png" "white.png"  # Tier 1 - missing
rename_file "$CURSORS_DIR" "002_silver.png" "gray.png"
rename_file "$CURSORS_DIR" "003_brownLeather.png" "brown.png"
rename_file "$CURSORS_DIR" "004_bronze.png" "bronze.png"
rename_file "$CURSORS_DIR" "005_silver.png" "silver.png"
rename_file "$CURSORS_DIR" "006_gold.png" "gold.png"
rename_file "$CURSORS_DIR" "007_roseGold.png" "rose-gold.png"
rename_file "$CURSORS_DIR" "008_platinum.png" "platinum.png"
rename_file "$CURSORS_DIR" "009_diamontCrystal.png" "diamond.png"
rename_file "$CURSORS_DIR" "010_holographic.png" "holographic.png"
rename_file "$CURSORS_DIR" "011_prismaticRainbow.png" "prismatic.png"
rename_file "$CURSORS_DIR" "101_goldenAuraSparkleTrail.png" "god.png"

# Streak/Epoch (101-105)
rename_file "$CURSORS_DIR" "101_orangeFlame.png" "orange-flame.png"
rename_file "$CURSORS_DIR" "102_blueFlame.png" "blue-flame.png"
rename_file "$CURSORS_DIR" "103_whitePlasmaFlame.png" "white-flame.png"
rename_file "$CURSORS_DIR" "104_vintageSepia.png" "vintage.png"
rename_file "$CURSORS_DIR" "105_sunsetGradient.png" "sunset.png"

# Hidden - Meme numbers (500-511)
rename_file "$CURSORS_DIR" "500_pink.png" "pink.png"
rename_file "$CURSORS_DIR" "501_smokeHazyGreen.png" "smoke-green.png"
rename_file "$CURSORS_DIR" "502_demonRedFlames.png" "demon-red.png"
rename_file "$CURSORS_DIR" "503_casionGoldSparkles.png" "casino-gold.png"
rename_file "$CURSORS_DIR" "504_matrixGreen.png" "matrix-green.png"
rename_file "$CURSORS_DIR" "505_lcdGreenDisplay.png" "lcd-green.png"
rename_file "$CURSORS_DIR" "506_vaporwave.png" "vaporwave.png"
rename_file "$CURSORS_DIR" "507_tieDye.png" "tie-dye.png"
rename_file "$CURSORS_DIR" "508_retro90s.png" "retro-90s.png"
rename_file "$CURSORS_DIR" "509_rasta.png" "rasta.png"
rename_file "$CURSORS_DIR" "510_blackWithLavaCracks.png" "lava.png"
rename_file "$CURSORS_DIR" "511_hotNeonPink.png" "hot-pink.png"

# Hidden - Ones family (520-523)
rename_file "$CURSORS_DIR" "520_lightGrey.png" "light-gray.png"
rename_file "$CURSORS_DIR" "521_silver.png" "silver-ones.png"
rename_file "$CURSORS_DIR" "522_silverSparkle.png" "silver-sparkle.png"
rename_file "$CURSORS_DIR" "523_whiteGlow.png" "white-glow.png"

# Hidden - Sevens family (524-526)
rename_file "$CURSORS_DIR" "524_gold.png" "gold-7.png"
rename_file "$CURSORS_DIR" "525_goldCoins.png" "gold-coins.png"
rename_file "$CURSORS_DIR" "526_goldSparkleBurst.png" "gold-sparkle.png"

# Hidden - Eights family (527-529)
rename_file "$CURSORS_DIR" "527_red.png" "red-8.png"
rename_file "$CURSORS_DIR" "528_redGoldTrim.png" "red-gold.png"
rename_file "$CURSORS_DIR" "529_redDragon.png" "dragon.png"

# Hidden - Nines family (530-532)
rename_file "$CURSORS_DIR" "530_lightPurple.png" "light-purple.png"
rename_file "$CURSORS_DIR" "531_darkPurple.png" "dark-purple.png"
rename_file "$CURSORS_DIR" "532_purpleGlitch.png" "glitch-purple.png"

# Hidden - Palindromes (540-545)
rename_file "$CURSORS_DIR" "540_simpleMirrorChrome.png" "mirror-chrome.png"
rename_file "$CURSORS_DIR" "541_polishedSilver.png" "polished-silver.png"
rename_file "$CURSORS_DIR" "542_glassTransparent.png" "glass.png"
rename_file "$CURSORS_DIR" "543_frostedGlass.png" "frosted-glass.png"
rename_file "$CURSORS_DIR" "544_fullMirror.png" "full-mirror.png"
rename_file "$CURSORS_DIR" "545_iridescentOil.png" "iridescent.png"

# Hidden - Math (560-566)
rename_file "$CURSORS_DIR" "560_chalk.png" "chalk-white.png"
rename_file "$CURSORS_DIR" "561_blueprint.png" "blueprint.png"
rename_file "$CURSORS_DIR" "562_goldenRatio.png" "golden-spiral.png"
rename_file "$CURSORS_DIR" "563_graphPaper.png" "graph-paper.png"
rename_file "$CURSORS_DIR" "564_blueWithPI.png" "blue-pi.png"
rename_file "$CURSORS_DIR" "565_glowingBlueEquations.png" "glowing-equations.png"
rename_file "$CURSORS_DIR" "566_cosmicNebula.png" "cosmic-nebula.png"

# Hidden - Powers of 2 (580-588)
rename_file "$CURSORS_DIR" "580_simpleGreenpcb.png" "pcb-green.png"
rename_file "$CURSORS_DIR" "581_pcbWithOneLED.png" "pcb-led.png"
rename_file "$CURSORS_DIR" "582_pcbWithTraces.png" "pcb-traces.png"
rename_file "$CURSORS_DIR" "583_pixelArt8Bit.png" "pixel-8bit.png"
rename_file "$CURSORS_DIR" "584_pixelArt16bit.png" "pixel-16bit.png"
rename_file "$CURSORS_DIR" "585_wireframe3D.png" "wireframe.png"
rename_file "$CURSORS_DIR" "586_lowPoly.png" "low-poly.png"
rename_file "$CURSORS_DIR" "587_hologramBlue.png" "hologram-blue.png"
rename_file "$CURSORS_DIR" "588_fullRBGAnimated.png" "rgb-animated.png"

# Hidden - Cultural (600-609)
rename_file "$CURSORS_DIR" "600_glitchedBroken.png" "glitched.png"
rename_file "$CURSORS_DIR" "601_redWarning.png" "red-warning.png"
rename_file "$CURSORS_DIR" "602_cloudWhite.png" "cloud-white.png"
rename_file "$CURSORS_DIR" "603_redWhiteAmbulence.png" "ambulance.png"
rename_file "$CURSORS_DIR" "604_surveillanceEye.png" "surveillance.png"
rename_file "$CURSORS_DIR" "605_starfield.png" "starfield.png"
rename_file "$CURSORS_DIR" "606_mayan.png" "mayan-stone.png"
rename_file "$CURSORS_DIR" "607_ironMan.png" "iron-man.png"
rename_file "$CURSORS_DIR" "608_towelTextureBeige.png" "towel.png"
rename_file "$CURSORS_DIR" "609_rainbowGradient.png" "rainbow-gradient.png"

echo ""
echo "=== 1/1 NFT RENAMES ==="
echo "Directory: $NFTS_DIR"
echo ""

# Global 1/1s - Powers of 10 (200-213)
rename_file "$NFTS_DIR" "200_Spacewar.png" "200.png"
rename_file "$NFTS_DIR" "201_Pong.png" "201.png"
rename_file "$NFTS_DIR" "202_SpaceInvaders.png" "202.png"
rename_file "$NFTS_DIR" "203_Asteroids.png" "203.png"
rename_file "$NFTS_DIR" "204_Berserk.png" "204.png"
rename_file "$NFTS_DIR" "205_Galaxian.png" "205.png"
rename_file "$NFTS_DIR" "206_PacMan.png" "206.png"
rename_file "$NFTS_DIR" "207_Tempest.png" "207.png"
rename_file "$NFTS_DIR" "208_Centipede.png" "208.png"
rename_file "$NFTS_DIR" "209_DonkeyKong.png" "209.png"
rename_file "$NFTS_DIR" "210_Frogger.png" "210.png"
rename_file "$NFTS_DIR" "211_DigDug.png" "211.png"
rename_file "$NFTS_DIR" "212_Joust.png" "212.png"
rename_file "$NFTS_DIR" "213_PolePosition.png" "213.png"

# Global Hidden 1/1s (220-229)
rename_file "$NFTS_DIR" "220_SmashTV.png" "220.png"
rename_file "$NFTS_DIR" "221_NBAJam.png" "221.png"
rename_file "$NFTS_DIR" "222_MortalKombat.png" "222.png"
rename_file "$NFTS_DIR" "223_JurassicPark.png" "223.png"
rename_file "$NFTS_DIR" "224_Area51.png" "224.png"
rename_file "$NFTS_DIR" "225_TMNT.png" "225.png"
rename_file "$NFTS_DIR" "226_XMen.png" "226.png"
rename_file "$NFTS_DIR" "227_StreetFighter2.png" "227.png"
rename_file "$NFTS_DIR" "228_VirtuaFighter.png" "228.png"
rename_file "$NFTS_DIR" "229_CruisnUSA.png" "229.png"

echo ""
echo "================================"
if [ "$DRY_RUN" == "false" ]; then
  echo "✓ Renames complete!"
else
  echo "DRY RUN - no files changed"
  echo "Run with --execute to apply:"
  echo "  ./scripts/rename-assets.sh --execute"
fi
