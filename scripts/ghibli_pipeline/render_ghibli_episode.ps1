param(
    [string]$CompositionId = "Episode03GhibliTest",
    [int]$TotalFrames = 3259,
    [string]$OutMp4 = "C:\Dipankar\Balak_Thakur_AI_Studio\03_Episodes\Episode_03_Five_Year_Old_Wisdom\04_Video_Assembly\Ghibli_Test_Render\Episode_03_Ghibli_Sketch_Test.mp4",
    [int]$NumChunks = 4
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProdRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$StudioDir = Join-Path $ProdRoot "remotion_studio"
$BundleDir = Join-Path $ProdRoot "bundle_ghibli_$CompositionId"
$ChunkDir = Join-Path $ProdRoot "chunks_$CompositionId"
$OutDir = Split-Path -Parent $OutMp4

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
New-Item -ItemType Directory -Force -Path $ChunkDir | Out-Null
Set-Location $StudioDir

$env:NODE_OPTIONS = "--max-old-space-size=6144"

Write-Host "=== [1/4] Bundling src/ghibli_pipeline/entry.tsx -> $BundleDir ==="
node node_modules/@remotion/cli/remotion-cli.js bundle src/ghibli_pipeline/entry.tsx --out-dir $BundleDir
if ($LASTEXITCODE -ne 0) { throw "Bundle failed with exit code $LASTEXITCODE" }

$ChunkSize = [math]::Ceiling($TotalFrames / $NumChunks)
$ListFile = Join-Path $ChunkDir "list.txt"
$ListLines = @()

for ($i = 0; $i -lt $NumChunks; $i++) {
    $Start = $i * $ChunkSize
    $End = [math]::Min($TotalFrames - 1, (($i + 1) * $ChunkSize) - 1)
    if ($Start -gt $End) { break }
    $PartName = ("part_{0:D2}.mp4" -f $i)
    $PartPath = Join-Path $ChunkDir $PartName
    Write-Host ("=== [2/4] Rendering Chunk {0}/{1} ({2} frames {3}..{4}) ===" -f ($i + 1), $NumChunks, $CompositionId, $Start, $End)
    node node_modules/@remotion/cli/remotion-cli.js render $BundleDir $CompositionId $PartPath --codec=h264 --crf=16 --concurrency=1 --gl=angle --frames="$Start-$End"
    if ($LASTEXITCODE -ne 0) { throw "Chunk $i render failed with exit code $LASTEXITCODE" }
    $ListLines += "file '$PartName'"
}

[System.IO.File]::WriteAllLines($ListFile, $ListLines, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "=== [3/4] Concatenating $NumChunks chunks into $OutMp4 ==="
ffmpeg -y -f concat -safe 0 -i $ListFile -c copy $OutMp4
if ($LASTEXITCODE -ne 0) { throw "ffmpeg concat failed with exit code $LASTEXITCODE" }

Write-Host "=== [4/4] Verifying final MP4 with ffprobe & join-boundary frame check ==="
ffprobe -v error -show_entries format=duration,size -show_entries stream=nb_frames,r_frame_rate,width,height -of default=noprint_wrappers=1 $OutMp4
$JoinSec = [math]::Round(($ChunkSize / 24.0) - 0.08, 2)
$JoinPattern = Join-Path $ChunkDir "join_check_%02d.png"
ffmpeg -y -ss $JoinSec -i $OutMp4 -frames:v 4 $JoinPattern

Write-Host "=== Render Complete: $OutMp4 ==="
