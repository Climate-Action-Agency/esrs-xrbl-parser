import path from 'path';

import { Xml2JSNode } from './types/global';
import { parseAndFollowLinks } from './lib/parsing';
import { printXMLTree, printObjectTree } from './lib/output';
import { buildLabelMap } from './lib/labels';

async function main() {
  const PRESENTATION_SEARCH_KEY = 'pre_esrs_';
  const filePath = process.argv?.[2] ?? 'ESRS-Set1-XBRL-Taxonomy/xbrl.efrag.org/taxonomy/esrs/2023-12-22/esrs_all.xsd';
  const rootPath = path.dirname(filePath);
  const searchFilter = {
    // maxLevel: 10,
    onlyFollowBranches: [PRESENTATION_SEARCH_KEY],
    ...(process.argv?.[3] !== undefined ? { level: 3, text: process.argv?.[3] } : {})
  };

  console.log(`${filePath} (filter ${JSON.stringify(searchFilter)}):\n`);

  // Build the tree starting from the root file
  const esrsAllXml = await parseAndFollowLinks(filePath, '', searchFilter);

  const linkbaseRefs =
    esrsAllXml?.['xsd:schema']?.['xsd:annotation']?.['xsd:appinfo']?.['link:linkbaseRef']?.filter(
      (linkbaseRef: Xml2JSNode) => linkbaseRef.$?.['xlink:href'].includes(PRESENTATION_SEARCH_KEY)
    ) ?? [];

  const labelFilePath = 'common/labels/lab_esrs-en.xml';
  // Parse the label file and build the label map using arcs
  const labelMap = await buildLabelMap(path.join(rootPath, labelFilePath));

  const presentations = linkbaseRefs.map((linkbaseRef: Xml2JSNode) => {
    const locs = linkbaseRef['link:linkbase'][0]['link:linkbase']['link:presentationLink']['link:loc'];
    return {
      href: linkbaseRef.$?.['xlink:href'],
      headlines: locs.map((loc: Xml2JSNode) => labelMap[loc.$['xlink:label']])
      // locs: locs
    };
  });

  // Output the result
  printXMLTree(presentations);
  console.log(JSON.stringify(presentations, null, 2));
}

main();
