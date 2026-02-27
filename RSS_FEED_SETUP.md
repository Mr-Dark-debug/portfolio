# RSS Feed Generation

This project includes an automatic RSS feed generation system that creates an RSS feed from your blog posts.

## How It Works

- The RSS feed is automatically generated during the build process thanks to the `postbuild` script in `package.json`
- The script reads all Markdown files in the `data/posts` directory
- It extracts metadata (title, date, description) from the frontmatter
- It creates an RSS XML file at `public/rss.xml`

## Adding New Posts

When you add a new blog post to the `data/posts` directory:

1. Make sure it has proper frontmatter with at least:
   - `title`
   - `date`
   - `description` (optional, will be generated from content if missing)

2. The next time you build the project, the RSS feed will automatically include your new post

## Manual Generation

To manually regenerate the RSS feed:
```bash
npm run generate-rss
# or if you added the script:
node ./scripts/generate-rss.js
```

## Watching for Changes (Development)

During development, you can watch for changes to the posts directory and automatically regenerate the RSS feed:
```bash
npm run watch-posts
```

## RSS Feed Location

The generated RSS feed is available at:
- `/rss.xml` (accessible via the web)
- Used for automatic discovery in the site's `<head>` tag

## Automatic Discovery

The site includes the proper link tag in the `<head>` for RSS discovery:
```html
<link rel="alternate" type="application/rss+xml" title="Prashant Blog RSS" href="/rss.xml" />
```

This allows browsers and RSS readers to automatically detect the feed.