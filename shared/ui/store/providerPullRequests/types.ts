import { Index } from "../common";
import { GetMyPullRequestsResponse } from "@codestream/protocols/agent";

export enum ProviderPullRequestActionsTypes {
	AddPullRequestConversations = "@providerPullRequests/AddConversations ",
	AddPullRequestFiles = "@providerPullRequests/AddFiles",
	AddPullRequestCommits = "@providerPullRequests/AddCommits",
	AddMyPullRequests = "@providerPullRequests/AddMyPullRequests",
	RemoveFromMyPullRequests = "@providerPullRequests/RemoveFromMyPullRequests",
	ClearMyPullRequests = "@providerPullRequests/ClearMyPullRequests",
	ClearPullRequestFiles = "@providerPullRequests/ClearFiles"
}

/**
 * data structure is as such:
 * myPullRequests: {
 * 	data: GetMyPullRequestsResponse[]
 * }
 * pullRequests: {
 * 	"github*com": {
 * 			"prId": {
 * 				conversations: any,
 * 				files: any[]
 * 				commits: any[]
 * 			}
 *  	}
 * 	}
 */
export type ProviderPullRequestsState = {
	myPullRequests: Index<{ data?: GetMyPullRequestsResponse[] }>;
	pullRequests: Index<Index<{ conversations: any; files?: any[]; commits?: any[] }>>;
};