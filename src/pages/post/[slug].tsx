import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  return (
    <>
      {router.isFallback ? (
        <div>Carregando...</div>
      ) : (
        <>
          <Head>
            <title>{post.data.title} | spacetravelling</title>
          </Head>
          <Header />
          <img
            src={post.data.banner.url}
            alt="eat sleep code repeat"
            className={styles.banner}
          />
          <main className={styles.postContainer}>
            <h1>{post.data.title}</h1>
            <div className={styles.postInfo}>
              <p>
                <img src="/calendar.svg" alt="calendar" />
                {post.first_publication_date}
              </p>
              <p>
                <img src="/user.svg" alt="user" />
                {post.data.author}
              </p>
              <p>
                <img src="/clock.svg" alt="clockuser" />5 min
              </p>
            </div>
            {post.data.content.map(content => (
              <article key={content.heading} className={styles.postContent}>
                <h2>{content.heading}</h2>
                <div
                  className={styles.postParagraphs}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </article>
            ))}
          </main>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 20,
    }
  );

  const post = posts.results.map(post => ({
    slug: post.uid,
  }));

  return {
    paths: [{ params: { slug: post[0].slug } }],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM y',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: [...content.body],
      })),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
