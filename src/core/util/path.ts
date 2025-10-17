import path from "path";
import { homedir } from "os";

export function getProjectPath(targetDir?: string) {
  if (targetDir) {
    // Expand ~ to home directory
    const expandedPath = targetDir.startsWith("~")
      ? path.join(homedir(), targetDir.slice(1))
      : targetDir;
    return path.resolve(expandedPath);
  }
  return process.cwd();
}

export function getProjectFolderName(targetDir?: string) {
  const projectPath = getProjectPath(targetDir);
  return path.basename(projectPath);
}
