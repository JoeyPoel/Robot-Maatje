/**
 * Hardware Skill Runner with Command Queue & Mutex Concurrency Locks
 * Serializes motion and servo commands to protect physical servo gears.
 */

import { spawn } from 'child_process';
import path from 'path';

export interface SkillExecutionResult {
  success: boolean;
  category: string;
  action: string;
  data?: unknown;
  error?: string;
  latencyMs: number;
}

class SkillRunner {
  private isMotionLocked = false;
  private queue: Array<{
    category: string;
    action: string;
    args: string[];
    resolve: (res: SkillExecutionResult) => void;
  }> = [];

  private skillsDir = path.resolve(process.cwd(), 'skills', 'alpha_mini');

  /**
   * Enqueue a hardware skill execution.
   * Motion actions are strictly serialized; non-motion commands execute immediately.
   */
  public async execute(
    category: 'MOTION' | 'SPEECH' | 'EXPRESSION' | 'VISION' | 'SYSTEM',
    action: string,
    args: string[]
  ): Promise<SkillExecutionResult> {
    if (category === 'MOTION') {
      return new Promise<SkillExecutionResult>((resolve) => {
        this.queue.push({ category, action, args, resolve });
        this.processQueue();
      });
    }

    // Direct execution for non-motion tasks
    return this.runScript(category, action, args);
  }

  private async processQueue() {
    if (this.isMotionLocked || this.queue.length === 0) return;

    this.isMotionLocked = true;
    const task = this.queue.shift();
    if (!task) {
      this.isMotionLocked = false;
      return;
    }

    try {
      const result = await this.runScript(task.category, task.action, task.args);
      task.resolve(result);
    } catch (err: unknown) {
      task.resolve({
        success: false,
        category: task.category,
        action: task.action,
        error: err instanceof Error ? err.message : String(err),
        latencyMs: 0,
      });
    } finally {
      this.isMotionLocked = false;
      // Slight settle delay before unlocking next physical motion
      setTimeout(() => this.processQueue(), 250);
    }
  }

  private runScript(
    category: string,
    action: string,
    args: string[]
  ): Promise<SkillExecutionResult> {
    const startTime = Date.now();
    let scriptName = 'skill_connection.py';

    switch (category) {
      case 'MOTION':
        scriptName = 'skill_motion.py';
        break;
      case 'SPEECH':
        scriptName = 'skill_speech.py';
        break;
      case 'EXPRESSION':
        scriptName = 'skill_expression.py';
        break;
      case 'VISION':
        scriptName = 'skill_vision_sensors.py';
        break;
      case 'SYSTEM':
      default:
        scriptName = 'skill_connection.py';
        break;
    }

    const scriptPath = path.join(this.skillsDir, scriptName);
    const fullArgs = [scriptPath, ...args, '--json'];

    return new Promise((resolve) => {
      const child = spawn('python', fullArgs, {
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('close', (code) => {
        const latencyMs = Date.now() - startTime;
        if (code === 0) {
          try {
            const data = JSON.parse(stdout.trim());
            resolve({
              success: true,
              category,
              action,
              data,
              latencyMs,
            });
          } catch {
            resolve({
              success: true,
              category,
              action,
              data: stdout.trim(),
              latencyMs,
            });
          }
        } else {
          resolve({
            success: false,
            category,
            action,
            error: stderr.trim() || `Exit code ${code}`,
            latencyMs,
          });
        }
      });

      child.on('error', (err) => {
        resolve({
          success: false,
          category,
          action,
          error: err.message,
          latencyMs: Date.now() - startTime,
        });
      });
    });
  }
}

export const skillRunner = new SkillRunner();

