import path from "path";

export function getProjectPath(targetDir?: string) {
  if (targetDir) {
    return path.resolve(targetDir);
  }
  return process.cwd();
}

export function getProjectFolderName(targetDir?: string) {
  const projectPath = getProjectPath(targetDir);
  return path.basename(projectPath);
}
