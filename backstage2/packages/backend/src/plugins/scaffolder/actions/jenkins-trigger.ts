import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Config } from '@backstage/config';

export const createJenkinsTriggerAction = (options: { config: Config }) => {
  const { config } = options;

  return createTemplateAction({
    id: 'jenkins:job:trigger',
    description: 'Triggers a Jenkins job with parameters',
    schema: {
      input: (zod) => zod.object({
        jobName: zod.string().describe('The name of the Jenkins job to trigger'),
        parameters: zod.record(zod.any()).optional().describe('Parameters to pass to the Jenkins job'),
      }),
      output: (zod) => zod.object({
        jobUrl: zod.string().describe('URL to the triggered Jenkins job'),
      }),
    },
    async handler(ctx) {
      const { jobName, parameters = {} } = ctx.input;

      const jenkinsInstances = config.getConfigArray('jenkins.instances');
      if (!jenkinsInstances || jenkinsInstances.length === 0) {
        throw new Error('No Jenkins instances configured');
      }
      
      const jenkinsConfig = jenkinsInstances[0];
      const baseUrl = jenkinsConfig.getString('baseUrl');
      const username = jenkinsConfig.getString('username');
      const apiKey = jenkinsConfig.getString('apiKey');

      const jobUrl = `${baseUrl}/job/${jobName}/buildWithParameters`;

      const formData = new URLSearchParams();
      Object.entries(parameters).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const auth = Buffer.from(`${username}:${apiKey}`).toString('base64');

      ctx.logger.info(`Triggering Jenkins job: ${jobName}`);
      ctx.logger.info(`Parameters: ${JSON.stringify(parameters)}`);

      try {
        const response = await fetch(jobUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to trigger Jenkins job: ${response.status} ${response.statusText}`
          );
        }

        const jobViewUrl = `${baseUrl}/job/${jobName}`;
        
        ctx.logger.info(`Successfully triggered Jenkins job: ${jobViewUrl}`);

        ctx.output('jobUrl', jobViewUrl);
      } catch (error) {
        throw new Error(
          `Failed to trigger Jenkins job: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
  });
};