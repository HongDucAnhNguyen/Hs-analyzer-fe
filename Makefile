ifndef u
u:=bobguy0606
endif

ifndef env
env:=dev
endif

deploy:
	ssh -i /Users/sotatek/.ssh/id_ecdsa_truong95k58 $(u)@$(h) "mkdir -p $(dir)"
	rsync -avhzL --delete \
				-e "ssh -i /Users/sotatek/.ssh/id_ecdsa_truong95k58" \
				--no-perms --no-owner --no-group \
				--exclude .git \
				--exclude .idea \
				--exclude .env \
				--exclude .next \
				--exclude node_modules \
				--exclude out \
				--exclude next.config.js \
				--exclude .husky \
				. $(u)@$(h):$(dir)/

deploy-dev-old:
	make deploy h=34.126.88.217 dir=/home/truong95k58/smart-hs-code-search-fe

deploy-dev:
	make deploy h=136.115.248.10 dir=/home/bobguy0606/smart-hs-code-search-fe
