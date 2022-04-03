import AdmZip from "adm-zip";

const zipify = (rootPath, fileInfos) => {
  const zip = new AdmZip();

  fileInfos.forEach((fi) => {
    const compositePath = `${rootPath?.concat("/") ?? ""}${fi.root?.concat(
      "/" ?? ""
    )}${fi.path}`;
    zip.addFile(compositePath, Buffer.from(fi.content, "utf8"));
  });

  return zip;
};

export default { zipify };
