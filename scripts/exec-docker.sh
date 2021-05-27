docker build -t expo-android .
docker run -e ADB_IP=192.168.112.101 \
            -e REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.1 \
            -p 19000:19000 \
            -p 19001:19001 \
            expo-android
