import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
Config.addElementLibrary({
    'url': 'https://www.remotion.dev/elements',
    'displayName': 'Remotion Elements'
});
