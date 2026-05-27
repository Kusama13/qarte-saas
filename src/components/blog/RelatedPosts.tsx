import { Link } from '@/i18n/navigation';
import { BLOG_ARTICLES } from '@/data/blog-articles';

interface RelatedPostsProps {
  slugs: string[];
  title?: string;
}

export function RelatedPosts({ slugs, title = 'À lire aussi' }: RelatedPostsProps) {
  const posts = slugs
    .map(slug => BLOG_ARTICLES.find(a => a.slug === slug))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  if (posts.length === 0) return null;

  return (
    <div className="mb-10 p-6 bg-violet-50 border border-violet-100 rounded-2xl">
      <p className="text-sm font-bold text-violet-900 mb-3">{title}</p>
      <ul className="space-y-2">
        {posts.map(post => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="text-base text-violet-700 hover:text-violet-900 underline"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
