#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, watch } from 'fs';
import { join } from 'path';

// Watch the posts directory for changes
const postsDir = join(process.cwd(), 'data', 'posts');

if (existsSync(postsDir)) {
  console.log(`Watching ${postsDir} for changes...`);
  
  // Set up a file watcher
  watch(postsDir, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.md')) {
      console.log(`${eventType} event detected on ${filename}`);
      
      // Wait a bit for the file to be fully written
      setTimeout(() => {
        console.log('Regenerating RSS feed...');
        try {
          execSync('node ./scripts/generate-rss.js', { stdio: 'inherit' });
          console.log('RSS feed regenerated successfully!');
        } catch (error) {
          console.error('Error regenerating RSS feed:', error.message);
        }
      }, 100);
    }
  });
} else {
  console.error(`Posts directory does not exist: ${postsDir}`);
}