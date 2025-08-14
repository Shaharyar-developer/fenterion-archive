import { useQuery } from "@tanstack/react-query";
import { authClient } from "./utils";
import { db } from "@/db";
import { client } from "./orpc.client";

export const userQuery = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const session = await authClient.getSession();
        if (!session || !session.data?.user) {
          return null;
        }
        const userId = session.data?.user.id;
        if (!userId) {
          return null;
        }
        const user = await client.user.get(userId);
        return user || null;
      } catch (error) {
        return null;
      }
    },
  });
};

export const authorQuery = () => {
  return useQuery({
    queryKey: ["author"],
    queryFn: async () => {
      try {
        const session = await authClient.getSession();
        if (!session || !session.data?.user) {
          return null;
        }
        const userId = session.data?.user.id;
        if (!userId) {
          return null;
        }
        const user = await client.author.getByUserId({ userId });
        return user || null;
      } catch (error) {
        return null;
      }
    },
  });
};

export const userWorksQuery = () => {
  return useQuery({
    queryKey: ["userWorks"],
    queryFn: async () => {
      const session = await authClient.getSession();
      if (!session || !session.data?.user) {
        return [];
      }
      const userId = session.data?.user.id;
      if (!userId) {
        return [];
      }

      const works = await client.work.getAllByAuthorId({
        authorId: userId,
      });
      return works || [];
    },
  });
};

export const chaptersQuery = (workId: string) => {
  return useQuery({
    queryKey: ["userChapters", workId],
    queryFn: async () => {
      const session = await authClient.getSession();
      if (!session || !session.data?.user) {
        return [];
      }
      const userId = session.data?.user.id;
      if (!userId) {
        return [];
      }

      const chapters = await client.chapter.getAllMetaByWorkId({
        workId,
      });
      return chapters;
    },
    enabled: !!workId,
  });
};

export const chapterVersionQuery = (versionId: string) => {
  return useQuery({
    queryKey: ["chapterVersion", versionId],
    queryFn: async () => {
      const session = await authClient.getSession();
      if (!session || !session.data?.user) {
        return null;
      }
      const userId = session.data?.user.id;
      if (!userId) {
        return null;
      }

      const chapterVersion = await client.chapter.getVersionById({
        id: versionId,
      });
      return chapterVersion || null;
    },
    enabled: !!versionId,
  });
};
