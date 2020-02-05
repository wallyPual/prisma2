import { PrismaClient, User, Category, Post } from "@prisma/client";
import { GraphQLServer } from "graphql-yoga";

const prisma = new PrismaClient();

const typeDefs = `
  type Query {
    seeUser(email: String): User!
    seePost(email: String!): [Post!]!
    seeCategories(name: String): [Category!]!
  }

  type Mutation {
    createPost(email: String!, title: String!, description: String!, categories: [String]): Post!
  }

  type User {
    id: Int!
    email: String!
    name: String
    posts: [Post]
  }

  type Post {
    id: Int!
    author: User!
    title: String!
    description: String!
    categories: [Category!]!
    createdAt: String!
    updatedAt: String!
  }

  type Category {
    id: Int!
    name: String!
    post: Post!
  }
`;

type UserProps = {
  email?: string | undefined;
};

type PostProps = {
  id?: number;
  email: string;
  title: string;
  description: string;
  categories: string[];
};

const resolvers = {
  Query: {
    seeUser: async (_: undefined, args: User) => {
      const { email } = args;
      if (email === undefined) return await prisma.user.findMany();

      const user: User | null = await prisma.user.findOne({
        where: {
          email
        }
      });

      return user;
    },
    seePost: async (_: undefined, args: User) => {
      const { email } = args;

      const post: Post[] = await prisma.post.findMany({
        where: {
          author: {
            email
          }
        }
      });

      return post;
    },
    seeCategories: async (_: undefined, args: Category) => {
      const { name } = args;

      if (name) {
        const categories: Category[] = await prisma.category.findMany({
          where: { name }
        });
        return categories;
      }
      return prisma.category.findMany();
    }
  },
  Mutation: {
    createPost: async (_: undefined, args: PostProps) => {
      const { email, title, description, categories } = args;
      const user: User | null = await prisma.user.findOne({
        where: {
          email
        }
      });

      if (user) {
        const post: Post = await prisma.post.create({
          data: {
            title,
            description,
            author: {
              connect: {
                email
              }
            }
          }
        });

        await categories.map(
          async name =>
            await prisma.category.create({
              data: {
                name,
                post: {
                  connect: {
                    id: post.id
                  }
                }
              }
            })
        );

        return post;
      } else {
        throw new Error("사용자를 찾지 못했습니다.");
      }
    }
  },
  Post: {
    categories: async ({ id }: PostProps) => {
      const categories: Category[] = await prisma.post
        .findOne({ where: { id } })
        .categories();

      return categories;
    }
  },
  Category: {
    post: async ({ id }: Category) => {
      const post: Post | null = await prisma.category
        .findOne({ where: { id } })
        .post();

      return post;
    }
  }
};

const server = new GraphQLServer({ typeDefs, resolvers });
server.start(() => console.log("Server is running on localhost:4000"));
