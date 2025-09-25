import path from "path";

export function getProjectPath() {
  return process.cwd();
}

export function getProjectFolderName() {
  const projectPath = getProjectPath();
  return path.basename(projectPath);
}
