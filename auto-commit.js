#!/usr/bin/env node

/**
 * Auto-Commit Script
 * 
 * This script automates git operations by checking for changes,
 * committing them with a specified message, and pushing to remote.
 * 
 * Usage:
 *   node auto-commit.js "Your commit message here"
 * 
 * If no commit message is provided, a default message with timestamp will be used.
 */

const { exec } = require('child_process');
const { promisify } = require('util');

// Convert exec to promise-based for cleaner async/await usage
const execAsync = promisify(exec);

/**
 * Execute a shell command and return the result
 * @param {string} command - Command to execute
 * @param {Object} options - Options for exec
 * @returns {Promise<{stdout: string, stderr: string}>} - Command output
 */
async function executeCommand(command, options = {}) {
  console.log(`[GIT] Executing command: ${command}`);
  
  try {
    const { stdout, stderr } = await execAsync(command, options);
    
    if (stderr && !stderr.includes('warning:')) {
      console.warn(`[GIT] Command produced stderr: ${stderr}`);
    }
    
    return { stdout: stdout.trim(), stderr, success: true };
  } catch (error) {
    console.error(`[GIT] Command failed: ${command}`);
    console.error(`[GIT] Error: ${error.message}`);
    
    if (error.stdout) console.log(`[GIT] stdout: ${error.stdout}`);
    if (error.stderr) console.error(`[GIT] stderr: ${error.stderr}`);
    
    return { 
      stdout: error.stdout || '', 
      stderr: error.stderr || error.message, 
      success: false,
      error
    };
  }
}

/**
 * Check if the repository has uncommitted changes
 * @param {string} repoPath - Path to the git repository
 * @returns {Promise<boolean>} - True if changes exist, false otherwise
 */
async function hasUncommittedChanges(repoPath) {
  console.log(`[GIT] Checking for uncommitted changes in ${repoPath}...`);
  
  const { stdout, success } = await executeCommand('git status --porcelain', { cwd: repoPath });
  
  if (!success) {
    throw new Error('Failed to check git status');
  }
  
  const hasChanges = stdout.length > 0;
  console.log(`[GIT] Uncommitted changes: ${hasChanges ? 'YES' : 'NO'}`);
  
  if (hasChanges) {
    console.log(`[GIT] Changes detected:\n${stdout}`);
  }
  
  return hasChanges;
}

/**
 * Get the current branch name
 * @param {string} repoPath - Path to the git repository
 * @returns {Promise<string>} - Current branch name
 */
async function getCurrentBranch(repoPath) {
  console.log(`[GIT] Getting current branch in ${repoPath}...`);
  
  const { stdout, success } = await executeCommand(
    'git rev-parse --abbrev-ref HEAD', 
    { cwd: repoPath }
  );
  
  if (!success) {
    throw new Error('Failed to get current branch');
  }
  
  console.log(`[GIT] Current branch: ${stdout}`);
  return stdout;
}

/**
 * Add all changes to git staging area
 * @param {string} repoPath - Path to the git repository
 * @returns {Promise<boolean>} - Success status
 */
async function gitAddAll(repoPath) {
  console.log(`[GIT] Adding all changes to staging area...`);
  
  const { success, stderr } = await executeCommand('git add .', { cwd: repoPath });
  
  if (!success) {
    console.error(`[GIT] Failed to add changes: ${stderr}`);
    return false;
  }
  
  console.log(`[GIT] Successfully added all changes to staging area`);
  return true;
}

/**
 * Commit changes with the specified message
 * @param {string} repoPath - Path to the git repository
 * @param {string} message - Commit message
 * @returns {Promise<boolean>} - Success status
 */
async function gitCommit(repoPath, message) {
  console.log(`[GIT] Committing changes with message: "${message}"...`);
  
  // Escape quotes in the message for the shell command
  const escapedMessage = message.replace(/"/g, '\\"');
  
  const { success, stdout, stderr } = await executeCommand(
    `git commit -m "${escapedMessage}"`, 
    { cwd: repoPath }
  );
  
  if (!success) {
    console.error(`[GIT] Failed to commit changes: ${stderr}`);
    return false;
  }
  
  console.log(`[GIT] Successfully committed changes: ${stdout}`);
  return true;
}

/**
 * Push changes to remote repository
 * @param {string} repoPath - Path to the git repository
 * @param {string} branch - Branch to push
 * @returns {Promise<boolean>} - Success status
 */
async function gitPush(repoPath, branch) {
  console.log(`[GIT] Pushing changes to remote (branch: ${branch})...`);
  
  const { success, stdout, stderr } = await executeCommand(
    `git push origin ${branch}`, 
    { cwd: repoPath }
  );
  
  if (!success) {
    console.error(`[GIT] Failed to push changes: ${stderr}`);
    return false;
  }
  
  console.log(`[GIT] Successfully pushed changes: ${stdout || 'Complete'}`);
  return true;
}

/**
 * Main function to handle the auto-commit process
 * @param {string} repoPath - Path to the git repository
 * @param {string} commitMessage - Commit message (optional)
 * @returns {Promise<boolean>} - Overall success status
 */
async function autoCommit(repoPath, commitMessage) {
  console.log('[GIT] =================================');
  console.log('[GIT] Starting auto-commit process...');
  console.log('[GIT] =================================');
  console.log(`[GIT] Repository path: ${repoPath}`);
  console.log(`[GIT] Commit message: ${commitMessage || 'Not specified (will use default)'}`);
  
  try {
    // Validate repo path
    if (!repoPath) {
      throw new Error('Repository path is required');
    }
    
    // Check if we have uncommitted changes
    const hasChanges = await hasUncommittedChanges(repoPath);
    
    if (!hasChanges) {
      console.log('[GIT] No changes to commit. Exiting.');
      return true;
    }
    
    // Get current branch
    const branch = await getCurrentBranch(repoPath);
    
    // Generate default commit message if not provided
    const timestamp = new Date().toISOString();
    const message = commitMessage || `Auto-commit: Changes at ${timestamp}`;
    
    // Add all changes
    const addSuccess = await gitAddAll(repoPath);
    if (!addSuccess) {
      return false;
    }
    
    // Commit changes
    const commitSuccess = await gitCommit(repoPath, message);
    if (!commitSuccess) {
      return false;
    }
    
    // Push changes
    const pushSuccess = await gitPush(repoPath, branch);
    // Even if push fails, the commit succeeded, so we return true
    
    console.log('[GIT] =================================');
    console.log(`[GIT] Auto-commit process completed`);
    console.log(`[GIT] Add: ${addSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`[GIT] Commit: ${commitSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`[GIT] Push: ${pushSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log('[GIT] =================================');
    
    return true;
  } catch (error) {
    console.error('[GIT] Auto-commit process failed:');
    console.error(`[GIT] ${error.message}`);
    console.error(`[GIT] ${error.stack}`);
    return false;
  }
}

/**
 * Command-line entry point
 */
async function main() {
  // Get the repository path (current directory by default)
  const repoPath = process.cwd();
  
  // Get commit message from command line arguments
  const commitMessage = process.argv.slice(2).join(' ').trim();
  
  try {
    await autoCommit(repoPath, commitMessage);
  } catch (error) {
    console.error(`Fatal error in auto-commit script: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled exception:', error);
    process.exit(1);
  });
}

// Export for use in other modules
module.exports = {
  autoCommit,
  hasUncommittedChanges,
  getCurrentBranch,
  gitAddAll,
  gitCommit,
  gitPush
};
