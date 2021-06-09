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

  const contentWordsAmount = post.data.content.reduce((total, item) => {
    const headingWordsAmount = item.heading.split(' ').length;
    total += headingWordsAmount;

    const bodyWordsAmountArray = item.body.map(p => p.text.split(' ').length);
    bodyWordsAmountArray.map(word => (total += word));
    return total;
  }, 0);

  const wordsReadPerMinuteAvg = 200;
  const readingTime = Math.ceil(contentWordsAmount / wordsReadPerMinuteAvg);

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM y',
    {
      locale: ptBR,
    }
  );

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
            alt="imagem"
            className={styles.banner}
          />
          <main className={`${styles.postContainer} ${commonStyles.container}`}>
            <h1>{post.data.title}</h1>
            <div className={`${styles.postInfo} ${commonStyles.postInfo}`}>
              <p>
                <img src="/calendar.svg" alt="calendar" />
                {formattedDate}
              </p>
              <p>
                <img src="/user.svg" alt="user" />
                {post.data.author}
              </p>
              <p>
                <img src="/clock.svg" alt="clockuser" />
                {readingTime} min
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
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
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
