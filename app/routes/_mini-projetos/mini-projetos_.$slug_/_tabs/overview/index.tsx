import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import axios from "axios";
import { useEffect } from "react";
import invariant from "tiny-invariant";
import {
  getChallenge,
  getChallengeParticipants,
  getUserFork,
  joinChallenge,
  updateChallengeCompleted,
  updateUserJoinedDiscord,
  userJoinedChallenge,
  verifyAndUpdateForkURL,
} from "~/models/challenge.server";
import { logout, user as getUser } from "~/services/auth.server";
import { abort404 } from "~/utils/responses.server";
import { buildInitialSteps } from "../../build-steps.server";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import { useColorMode } from "~/contexts/color-mode-context";
import { toast } from "react-hot-toast";
import JoinChallengeSection from "../../join-challenge-section";
import RepositoryInfoSection from "~/components/repository-info-section";
import CardItemRibbon from "~/components/cards/card-item-ribbon";
import { BsFillPlayFill } from "react-icons/bs";

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();

  const intent = formData.get("intent") as string;
  const redirectTo = formData.get("redirectTo") as string;
  const slug = redirectTo.split("/")[2];
  const user = await getUser({ request });

  switch (intent) {
    case "connect-github":
      return logout({ request, redirectTo: `/login?redirectTo=${redirectTo}` });
    case "join-challenge":
      return joinChallenge({ request, slug });
    case "verify-fork":
      return verifyAndUpdateForkURL({
        slug,
        githubUser: user.github_user,
        request,
      });
    case "join-discord":
      return updateUserJoinedDiscord({
        slug,
        joinedDiscord: true,
        request,
      });
    case "finish-challenge":
      return updateChallengeCompleted({
        slug,
        completed: true,
        request,
      });
  }
}

export const loader = async ({ params, request }: LoaderArgs) => {
  invariant(params.slug, `params.slug is required`);
  const [challenge, participants] = await Promise.all([
    getChallenge(params.slug),
    getChallengeParticipants(params.slug),
  ]);

  if (!challenge) {
    abort404();
  }

  const user = await getUser({ request });

  let challengeUser;
  if (user) {
    try {
      challengeUser = await userJoinedChallenge(params.slug, request);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (err?.response?.status) challengeUser = null;
      }
    }
  }

  return json({
    user,
    slug: params.slug,
    challenge,
    participants,

    challengeUser,
    initialSteps: buildInitialSteps({
      user,
      challengeUser,
      repositoryUrl: challenge.repository_url,
    }),
  });
};

export default function ChallengeIndex() {
  const { challenge, initialSteps, challengeUser } =
    useLoaderData<typeof loader>();
  const actionData = useActionData();
  const { colorMode } = useColorMode();

  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData?.error);
    }

    if (actionData?.success) {
      toast.success(actionData?.success);
    }
  }, [actionData]);
  return (
    <div className="container grid grid-cols-12 gap-10">
      <div className="col-span-12 space-y-20 lg:col-span-8">
        <div>
          <h1 className="flex items-center text-2xl font-semibold font-lexend">
            Vídeo de introdução
          </h1>
          <section className="relative mt-4 mb-8">
            <div className="relative aspect-video">
              <div className="absolute top-0 z-0 w-full overflow-hidden opacity-1 lg:rounded-xl">
                <div style={{ padding: "56.30% 0 0 0", position: "relative" }}>
                  <iframe
                    src="https://player.vimeo.com/video/238455692"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "0",
                      width: "100%",
                      height: "100%",
                    }}
                    title="C0193vid007-1"
                  ></iframe>
                </div>
                <script src="https://player.vimeo.com/api/player.js"></script>
              </div>
            </div>
          </section>
        </div>
        <div className="col-span-12 lg:col-span-8">
          <h1 className="flex items-center mb-4 text-2xl font-semibold font-lexend">
            Descrição
          </h1>
          <p className="mt-2 mb-4 font-light font-inter text-md md:text-xl text-start ">
            {challenge?.description}
          </p>
        </div>
      </div>
      <div className="col-span-12 space-y-20 lg:col-span-4">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold font-lexend">
              {challengeUser ? "Seu progresso" : "Participe"}
            </h1>
            {challengeUser && (
              <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 shadow-sm">
                <svg
                  className="h-1.5 w-1.5 fill-green-500 animate-pulse"
                  viewBox="0 0 6 6"
                  aria-hidden="true"
                >
                  <circle cx={3} cy={3} r={3} />
                </svg>
                Você está ativo!
              </span>
            )}
          </div>
          <JoinChallengeSection initialSteps={initialSteps} />
        </div>

        <div>
          <h1 className="flex items-center mb-4 text-2xl font-semibold font-lexend">
            Repositório
          </h1>
          <RepositoryInfoSection
            repository={{
              organization: "codante-io",
              name: challenge?.slug,
            }}
          />
        </div>
        <ResolutionSection
          isAvailable={challenge?.workshop?.status === "published"}
        />
      </div>
    </div>
  );
}

function ResolutionSection({ isAvailable }: { isAvailable: boolean }) {
  return (
    <div>
      <h1 className="flex items-center mb-2 text-2xl font-semibold font-lexend">
        Resolução
      </h1>
      {!isAvailable && (
        <p className="text-sm text-slate-400">
          Esta resolução será publicada em breve!{" "}
          <button className="text-xs underline text-brand">Me avise!</button>
        </p>
      )}
      <Link to="resolucao">
        <div
          className={`relative w-full h-[250px] sm:h-[400px] lg:h-[210px] bg-black flex items-center justify-center rounded-lg mt-6 mb-20 ${
            !isAvailable && "cursor-not-allowed"
          }`}
        >
          {!isAvailable && <CardItemRibbon text="Disponível em breve" />}
          <span
            className={`flex items-center justify-center w-8 h-8 text-gray-700 rounded-full bg-slate-100 ${
              !isAvailable && "cursor-not-allowed"
            }`}
          >
            <BsFillPlayFill size={16} color="#5282FF" />
          </span>
        </div>
      </Link>
    </div>
  );
}
