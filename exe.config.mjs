import * as ResEdit from "resedit";
import * as fs from "fs";
import * as path from "path";
// import packageJson from './packages/contensis-cli/package.json' assert { type: 'json' };
const packageJson = JSON.parse(fs.readFileSync('./packages/contensis-cli/package.json'));

// Set your inputs:
const exePath = "bin/contensis-cli.exe";  // Path to the generated executable
const outputPath = exePath;          // Overwrite or use a different path
const version = packageJson.version;             // Your application version

// const lang = 2057;       // en-GB
// changing lang breaks the exe
const lang = 1033;       // en-US 
const codepage = 1200;   // Unicode

const exeData = fs.readFileSync(exePath);
const exe = ResEdit.NtExecutable.from(exeData);
const res = ResEdit.NtExecutableResource.from(exe);


// load icon data from file
// (you can use ResEdit.Data.IconFile to parse icon data)
const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync('./assets/icon.ico'));
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
  // destEntries
  res.entries,
  // iconGroupID
  // - This ID is originally defined in base executable file
  //   (the ID list can be retrieved by `ResEdit.Resource.IconGroupEntry.fromEntries(res.entries).map((entry) => entry.id)`)
  1,
  lang,
  iconFile.icons.map((item) => item.data)
);

// -- replace version
const viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
const vi = viList[0];

const [major, minor, patch, build] = version.split(".");
vi.setFileVersion(Number(major), Number(minor), Number(patch.split('-')[0]), Number(build || 0), lang);
vi.setProductVersion(Number(major), Number(minor), Number(patch.split('-')[0]), Number(build || 0), lang);

vi.setStringValues({ lang, codepage }, {
  FileDescription: 'Contensis CLI',
  ProductName: "Contensis CLI",
  CompanyName: "Zengenti Ltd",
  ProductVersion: version,
  FileVersion: version,
  OriginalFilename: path.basename(exePath),
  LegalCopyright: `© ${new Date().getFullYear()} Zengenti Ltd`
});

vi.outputToResourceEntries(res.entries);
res.outputResource(exe);
const newBinary = exe.generate();

fs.writeFileSync(outputPath, Buffer.from(newBinary));
console.log('Windows x64 exe build completed')
