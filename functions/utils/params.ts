interface Parameters {
	projectName: string;
	releaseChannel: string;
}

export function getParams(params: Params<ParamKeys>): Parameters {
	return {
		projectName: params.projectName as string,
		releaseChannel: params.releaseChannel as string,
	};
}
